using MediatR;
using WMS.Application.Features.InventoryRequests.Shared;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.InventoryRequests.CreateRequest;

// ─── Input DTOs ──────────────────────────────────────────────────────────────
public record CreateInventoryItemInput
{
    public string ItemName { get; init; } = "";
    public int Quantity { get; init; }
    public string Unit { get; init; } = "cái";
    public decimal? Weight { get; init; }
    /// <summary>diện tích ước tính (m²) do Renter điền tự hoặc do AI gợi ý.</summary>
    public decimal? EstimatedVolume { get; init; }
    public string? Description { get; init; }
    /// <summary>FK về catalogue renter_assets (nếu chọn từ catalogue)</summary>
    public int? AssetId { get; init; }
}

// ─── Command ─────────────────────────────────────────────────────────────────
public record CreateInventoryRequestCommand : IRequest<InventoryRequestDto>
{
    public int RenterId { get; init; }
    public int WarehouseId { get; init; }
    public string Type { get; init; } = "INBOUND";
    public string? Notes { get; init; }
    public List<string>? DocumentUrls { get; init; }
    public List<CreateInventoryItemInput> Items { get; init; } = new();
    public DateTime? ScheduledDate { get; init; }
    /// <summary>Giữ lại cho backward-compatible nhưng không bắt buộc ở bước tạo nữa.</summary>
    public string? RenterSignatureBase64 { get; init; }
}

// ─── Handler ─────────────────────────────────────────────────────────────────
public class CreateInventoryRequestHandler
    : IRequestHandler<CreateInventoryRequestCommand, InventoryRequestDto>
{
    private readonly IInventoryRequestRepository _repo;
    private readonly IWarehouseInventoryRepository _invRepo;
    private readonly IWarehouseRepository _warehouseRepo;
    private readonly IRenterAssetRepository _assetRepo;
    private readonly ITaskRepository _taskRepo;
    private readonly IRentalContractRepository _contractRepo;
    private readonly IEmailService _emailService;
    private readonly IInventoryRequestStaffNotifier _staffNotifier;

    public CreateInventoryRequestHandler(
        IInventoryRequestRepository repo,
        IWarehouseInventoryRepository invRepo,
        IWarehouseRepository warehouseRepo,
        IRenterAssetRepository assetRepo,
        ITaskRepository taskRepo,
        IRentalContractRepository contractRepo,
        IEmailService emailService,
        IInventoryRequestStaffNotifier staffNotifier)
    {
        _repo          = repo;
        _invRepo       = invRepo;
        _warehouseRepo = warehouseRepo;
        _assetRepo     = assetRepo;
        _taskRepo      = taskRepo;
        _contractRepo  = contractRepo;
        _emailService  = emailService;
        _staffNotifier = staffNotifier;
    }

    public async Task<InventoryRequestDto> Handle(
        CreateInventoryRequestCommand cmd, CancellationToken cancellationToken)
    {
        var warehouse = await _warehouseRepo.GetByIdAsync(cmd.WarehouseId, cancellationToken);
        if (warehouse == null) throw new KeyNotFoundException("Warehouse not found");

        if (!warehouse.IsCurrentlyAccessible())
        {
            var timeStr = warehouse.Is24HoursAccess ? "24/7" : $"{warehouse.OpenTime} - {warehouse.CloseTime}";
            throw new InvalidOperationException(
                $"Kho hiện đang đóng cửa. Thời gian hoạt động: {timeStr}. Vui lòng thực hiện yêu cầu trong giờ làm việc.");
        }

        // ── Dual-Constraint Validation cho INBOUND ─────────────────────────
        bool volumeWarning = false;

        if (cmd.Type.ToUpper() == "INBOUND")
        {
            // Kiểm tra trạng thái hợp đồng, chỉ cho nhập khi ACTIVE
            bool isActiveContract = await _contractRepo.IsRenterByContractAsync(cmd.RenterId, cmd.WarehouseId, cancellationToken);
            if (!isActiveContract)
            {
                throw new InvalidOperationException("Hợp đồng đã hết hạn hoặc không tồn tại, không thể yêu cầu nhập thêm hàng.");
            }

            const decimal KgPerM2Limit = 500m;

            var contractedArea = await _contractRepo.GetContractedAreaAsync(
                cmd.RenterId, cmd.WarehouseId, cancellationToken);

            if (contractedArea > 0)
            {
                // ── Tầng 1: Hard block — Trọng lượng ──────────────────
                decimal totalWeightKg = 0;
                bool    hasWeightData = false;

                foreach (var item in cmd.Items)
                {
                    decimal? wPerUnit = item.Weight;

                    if ((wPerUnit == null || wPerUnit <= 0) && item.AssetId.HasValue && item.AssetId.Value > 0)
                    {
                        var assetForWeight = await _assetRepo.GetByIdAsync(item.AssetId.Value, cancellationToken);
                        wPerUnit = assetForWeight?.WeightPerUnit;
                    }

                    if (wPerUnit.HasValue && wPerUnit.Value > 0)
                    {
                        hasWeightData = true;
                        totalWeightKg += wPerUnit.Value * item.Quantity;
                    }
                }

                if (hasWeightData)
                {
                    decimal maxWeightKg = (decimal)contractedArea * KgPerM2Limit;
                    if (totalWeightKg > maxWeightKg)
                        throw new InvalidOperationException(
                            $"Tổng trọng lượng lô hàng ({totalWeightKg:N0} kg) vượt quá tải trọng sàn kho cho phép. " +
                            $"Diện tích hợp đồng: {contractedArea:N0} m² × {KgPerM2Limit:N0} kg/m² = tối đa {maxWeightKg:N0} kg. " +
                            $"Vui lòng chia thành nhiều lô nhỏ hơn hoặc liên hệ quản lý kho.");
                }

                // ── Tầng 2: Soft check — diện tích (cảnh báo, không chặn) ──
                decimal totalEstimatedVol = cmd.Items.Sum(i => i.EstimatedVolume ?? 0);
                if (totalEstimatedVol > 0 && warehouse.AvailableVolume.HasValue && warehouse.AvailableVolume.Value > 0)
                {
                    if ((double)totalEstimatedVol > warehouse.AvailableVolume.Value)
                    {
                        volumeWarning = true; // Gắn cờ — Manager sẽ thấy khi duyệt
                    }
                }
            }
        }

        // Resolve asset info & build InventoryItems
        var inventoryItems = new List<InventoryItem>();
        foreach (var item in cmd.Items)
        {
            string itemName    = item.ItemName;
            string unit        = item.Unit;
            decimal? weight    = item.Weight;
            int? assetId       = item.AssetId;

            if (assetId.HasValue && assetId.Value > 0)
            {
                var asset = await _assetRepo.GetByIdAsync(assetId.Value, cancellationToken);
                if (asset == null)
                    throw new KeyNotFoundException($"Asset #{assetId.Value} không tồn tại.");
                if (asset.RenterId != cmd.RenterId)
                    throw new UnauthorizedAccessException($"Asset #{assetId.Value} không thuộc về bạn.");

                itemName = asset.AssetName;
                unit     = !string.IsNullOrWhiteSpace(item.Unit) ? item.Unit : (asset.Unit ?? "cái");
                weight   = asset.WeightPerUnit.HasValue ? asset.WeightPerUnit * item.Quantity : item.Weight;
            }

            // OUTBOUND: check stock
            if (cmd.Type.ToUpper() == "OUTBOUND")
            {
                if (assetId.HasValue && assetId.Value > 0)
                {
                    var inventory = await _assetRepo.GetInventoryByRenterAsync(
                        cmd.RenterId, cmd.WarehouseId, cancellationToken);
                    var ri = inventory.FirstOrDefault(x => x.AssetId == assetId.Value);
                    var available = ri?.Quantity ?? 0;
                    if (available < item.Quantity)
                        throw new InvalidOperationException(
                            $"Không đủ tồn kho cho '{itemName}'. Hiện có: {available}, yêu cầu: {item.Quantity}.");
                }
                else
                {
                    var inv = await _invRepo.GetAsync(cmd.WarehouseId, itemName, cancellationToken);
                    var available = inv?.Quantity ?? 0;
                    if (available < item.Quantity)
                        throw new InvalidOperationException(
                            $"Không đủ hàng tồn kho cho '{itemName}'. Hiện có: {available}, yêu cầu: {item.Quantity}.");
                }
            }

            inventoryItems.Add(new InventoryItem
            {
                ItemName        = itemName,
                Quantity        = item.Quantity,
                Unit            = unit,
                Weight          = weight,
                EstimatedVolume = item.EstimatedVolume,
                Description     = item.Description,
                AssetId         = assetId,
            });
        }

        // ── Sinh mã RequestCode ───────────────────────────────────────────
        var prefix = cmd.Type.ToUpper() == "OUTBOUND" ? "OUT" : "INB";
        var dateStr = DateTime.Now.ToString("yyyyMMdd");
        // Đếm số yêu cầu cùng loại trong ngày để sinh số thứ tự
        var todayStart = DateTime.Today;
        var requestCode = $"{prefix}-{dateStr}-{DateTime.Now.Ticks % 10000:D4}";

        // ── Phân luồng Smart Routing ──
        // Hệ thống tự động duyệt nếu đã qua validation và Renter CÓ sử dụng AI (diện tích > 0)
        // và AI đánh giá diện tích không vượt quá hợp đồng.
        bool canAutoApprove = false;
        if (cmd.Type.ToUpper() == "INBOUND")
        {
            decimal totalEstimatedVol = cmd.Items.Sum(i => i.EstimatedVolume ?? 0);
            canAutoApprove = totalEstimatedVol > 0 && !volumeWarning;
        }
        else
        {
            // OUTBOUND luôn có dữ liệu tồn kho chuẩn xác -> có thể auto-approve
            canAutoApprove = true;
        }

        var status = canAutoApprove ? "CONFIRMED" : "PENDING";
        var confirmedAt = canAutoApprove ? (DateTime?)DateTime.Now : null;

        var request = new InventoryRequest
        {
            RenterId    = cmd.RenterId,
            WarehouseId = cmd.WarehouseId,
            Type        = cmd.Type.ToUpper(),
            RequestCode = requestCode,
            Notes       = string.IsNullOrWhiteSpace(cmd.Notes) ? null : $"Người thuê: {cmd.Notes}",
            DocumentUrls = cmd.DocumentUrls != null && cmd.DocumentUrls.Count > 0
                ? System.Text.Json.JsonSerializer.Serialize(cmd.DocumentUrls)
                : null,
            Status         = status,
            ConfirmedAt    = confirmedAt,
            InventoryItems = inventoryItems,
            ScheduledDate  = cmd.ScheduledDate,
            VolumeWarning  = volumeWarning,
            RenterSignatureBase64 = cmd.RenterSignatureBase64,
        };

        var created = await _repo.CreateAsync(request, cancellationToken);

        // Tự động tạo WarehouseTask
        var taskScheduledAt = cmd.ScheduledDate ?? created.CreatedAt ?? DateTime.Now;
        await _taskRepo.CreateWorkflowTaskAsync(
            cmd.Type.ToUpper(),
            created.InvReqId,
            cmd.WarehouseId,
            taskScheduledAt,
            cancellationToken);

        var full = await _repo.GetByIdAsync(created.InvReqId, cancellationToken);

        if (canAutoApprove)
        {
            // Đóng UnitTask bước duyệt (vì đã auto-approve)
            var approveCode = cmd.Type.ToUpper() == "OUTBOUND" ? "OUTBOUND_APPROVE" : "INBOUND_APPROVE";
            try { await _taskRepo.CompleteUnitTaskAsync(cmd.Type.ToUpper(), created.InvReqId, approveCode, 0, cancellationToken); }
            catch { /* Task không tìm thấy — không chặn nghiệp vụ */ }

            // Fire-and-forget: gửi email không chặn response để trả kết quả nhanh cho user
            var fullCopy = full;
            var whCopy = warehouse;
            _ = Task.Run(async () =>
            {
                try { await SendAutoApproveEmail(fullCopy!, whCopy); } catch { }
                try { await _staffNotifier.NotifyReadyForProcessingAsync(fullCopy!, default); } catch { }
            });
        }
        else
        {
            // Fire-and-forget: gửi email pending
            var fullCopy = full;
            var whCopy = warehouse;
            _ = Task.Run(async () =>
            {
                try { await SendPendingEmail(fullCopy!, whCopy); } catch { }
            });
        }

        return InventoryRequestMapper.ToDto(full!);
    }

    /// <summary>Gửi email xác nhận tự động cho Renter khi hệ thống auto-approve.</summary>
    private async Task SendAutoApproveEmail(InventoryRequest req, Warehouse warehouse)
    {
        if (req.Renter == null || string.IsNullOrEmpty(req.Renter.Email)) return;

        var reqTypeStr = req.Type == "INBOUND" ? "nhập kho" : "xuất kho";
        var actionStr = req.Type == "INBOUND"
            ? "vận chuyển hàng hóa tới kho để lưu kho"
            : "sắp xếp xe đến kho để lấy hàng";
        var requestCodeStr = req.RequestCode ?? $"#{req.InvReqId}";
        var confirmedAtStr = req.ConfirmedAt?.ToString("dd/MM/yyyy HH:mm") ?? DateTime.Now.ToString("dd/MM/yyyy HH:mm");

        var subject = req.Type == "INBOUND"
            ? $"✅ Yêu cầu nhập kho {requestCodeStr} đã được tự động duyệt"
            : $"✅ Yêu cầu xuất kho {requestCodeStr} đã được tự động duyệt";

        var htmlContent = $@"
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;'>
    <h2 style='color: #16a34a; text-align: center;'>Yêu cầu {reqTypeStr} đã được tiếp nhận!</h2>
    <p>Xin chào <strong>{req.Renter.FullName}</strong>,</p>
    <p>Hệ thống đã tự động tiếp nhận yêu cầu {reqTypeStr} mã <strong>{requestCodeStr}</strong> của bạn tại kho <strong>{warehouse.Name}</strong>.</p>
    
    <div style='background-color: #f0fdf4; padding: 12px 16px; border-radius: 6px; margin: 16px 0; border: 1px solid #bbf7d0;'>
        <p style='margin: 0; color: #166534; font-weight: 600; font-size: 14px;'>
            Yêu cầu của bạn đã hợp lệ và đang chờ nhân viên kho xử lý. Không cần chờ duyệt thêm.
        </p>
    </div>

    <div style='background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;'>
        <h3 style='margin-top: 0; color: #374151;'>Thông tin chi tiết:</h3>
        <ul style='color: #4b5563; line-height: 1.6;'>
            <li><strong>Mã yêu cầu:</strong> {requestCodeStr}</li>
            <li><strong>Kho xử lý:</strong> {warehouse.Name}</li>
            <li><strong>Thời gian tiếp nhận:</strong> {confirmedAtStr}</li>
        </ul>
    </div>

    <p style='color: #1f2937; font-weight: bold;'>Bước tiếp theo:</p>
    <p>Bạn có thể tiến hành <strong>{actionStr}</strong> theo thời gian đã dự kiến. Đội ngũ nhân viên kho đã sẵn sàng hỗ trợ bạn.</p>

    <div style='margin-top: 30px; text-align: center;'>
        <a href='http://localhost:3000/renter-inventory-history' style='background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;'>Xem chi tiết yêu cầu</a>
    </div>
    
    <hr style='border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;' />
    <p style='font-size: 12px; color: #9ca3af; text-align: center;'>Đây là email tự động từ hệ thống OWRMS. Vui lòng không trả lời email này.</p>
</div>";

        await _emailService.SendInfo(req.Renter.Email, req.Renter.FullName, subject, htmlContent);
    }

    /// <summary>Gửi email thông báo Pending khi cần duyệt thủ công.</summary>
    private async Task SendPendingEmail(InventoryRequest req, Warehouse warehouse)
    {
        if (req.Renter == null || string.IsNullOrEmpty(req.Renter.Email)) return;

        var reqTypeStr = req.Type == "INBOUND" ? "nhập kho" : "xuất kho";
        var requestCodeStr = req.RequestCode ?? $"#{req.InvReqId}";

        var subject = $"⏳ Yêu cầu {reqTypeStr} {requestCodeStr} đang chờ xét duyệt";

        var htmlContent = $@"
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;'>
    <h2 style='color: #d97706; text-align: center;'>Yêu cầu {reqTypeStr} đang chờ duyệt</h2>
    <p>Xin chào <strong>{req.Renter.FullName}</strong>,</p>
    <p>Yêu cầu {reqTypeStr} mã <strong>{requestCodeStr}</strong> của bạn tại kho <strong>{warehouse.Name}</strong> đã được gửi lên hệ thống và đang trong trạng thái <strong>Chờ tiếp nhận</strong>.</p>
    
    <div style='background-color: #fffbeb; padding: 12px 16px; border-radius: 6px; margin: 16px 0; border: 1px solid #fde68a;'>
        <p style='margin: 0; color: #92400e; font-weight: 600; font-size: 14px;'>
            Do yêu cầu được tạo thủ công (chưa được AI tính diện tích), Quản lý kho sẽ cần xem xét để đảm bảo đủ không gian lưu trữ trước khi duyệt.
        </p>
    </div>

    <p>Hệ thống sẽ gửi thông báo cho bạn ngay sau khi yêu cầu được phê duyệt. Xin vui lòng chờ đợi.</p>

    <div style='margin-top: 30px; text-align: center;'>
        <a href='http://localhost:3000/renter-inventory-history' style='background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;'>Xem trạng thái yêu cầu</a>
    </div>
    
    <hr style='border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;' />
    <p style='font-size: 12px; color: #9ca3af; text-align: center;'>Đây là email tự động từ hệ thống OWRMS.</p>
</div>";

        await _emailService.SendInfo(req.Renter.Email, req.Renter.FullName, subject, htmlContent);
    }
}
