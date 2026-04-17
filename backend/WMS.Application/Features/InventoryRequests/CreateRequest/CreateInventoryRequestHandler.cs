using MediatR;
using WMS.Application.Features.InventoryRequests.Shared;
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

    public CreateInventoryRequestHandler(
        IInventoryRequestRepository repo,
        IWarehouseInventoryRepository invRepo,
        IWarehouseRepository warehouseRepo,
        IRenterAssetRepository assetRepo,
        ITaskRepository taskRepo,
        IRentalContractRepository contractRepo)
    {
        _repo          = repo;
        _invRepo       = invRepo;
        _warehouseRepo = warehouseRepo;
        _assetRepo     = assetRepo;
        _taskRepo      = taskRepo;
        _contractRepo  = contractRepo;
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

        // ── Dual-Constraint Validation cho INBOUND ─────────────────────────────────
        if (cmd.Type.ToUpper() == "INBOUND")
        {
            const int    UnitsPerM2     = 10;       // Hệ số ước lượng số đơn vị / m²
            const decimal KgPerM2Limit  = 500m;    // Tải trọng sàn tiêu chuẩn kho (kg/m²)

            var contractedArea = await _contractRepo.GetContractedAreaAsync(
                cmd.RenterId, cmd.WarehouseId, cancellationToken);

            if (contractedArea > 0)
            {
                // ── Tầng 1: Hard block — Trọng lượng (giới hạn vật lý sàn kho) ──────
                // Chỉ áp dụng khi item CÓ weightPerUnit. Hàng siêu nhẹ (bút, hộp giấy...)
                // không có weight sẽ bỏ qua và để Manager quyết định khi duyệt.
                decimal totalWeightKg = 0;
                bool    hasWeightData = false;

                foreach (var item in cmd.Items)
                {
                    decimal? wPerUnit = item.Weight; // weight đã được resolve từ asset (nếu có)

                    // Nếu có assetId, thử lấy weight từ catalogue
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

                // ── Tầng 2: Soft check — Số lượng đơn vị (chỉ thông báo, không chặn) ──
                // Nếu tổng vượt ước lượng diện tích nhưng hàng nhẹ/nhỏ → Manager tự phán quyết
                // Logic này được thực hiện ở frontend (soft warning màu vàng)
                // Backend không chặn để Manager approval flow hoạt động bình thường
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

            // If assetId provided, lookup catalogue to auto-fill
            if (assetId.HasValue && assetId.Value > 0)
            {
                var asset = await _assetRepo.GetByIdAsync(assetId.Value, cancellationToken);
                if (asset == null)
                    throw new KeyNotFoundException($"Asset #{assetId.Value} không tồn tại.");
                if (asset.RenterId != cmd.RenterId)
                    throw new UnauthorizedAccessException($"Asset #{assetId.Value} không thuộc về bạn.");

                itemName = asset.AssetName;
                // Ưu tiên đơn vị user chọn trong form; chỉ dùng đơn vị từ catalogue làm fallback
                unit     = !string.IsNullOrWhiteSpace(item.Unit) ? item.Unit : (asset.Unit ?? "cái");
                weight   = asset.WeightPerUnit.HasValue ? asset.WeightPerUnit * item.Quantity : item.Weight;
            }

            // OUTBOUND: check stock
            if (cmd.Type.ToUpper() == "OUTBOUND")
            {
                if (assetId.HasValue && assetId.Value > 0)
                {
                    // Check renter_inventory
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
                    // Fallback: check warehouse_inventory (text-based)
                    var inv = await _invRepo.GetAsync(cmd.WarehouseId, itemName, cancellationToken);
                    var available = inv?.Quantity ?? 0;
                    if (available < item.Quantity)
                        throw new InvalidOperationException(
                            $"Không đủ hàng tồn kho cho '{itemName}'. Hiện có: {available}, yêu cầu: {item.Quantity}.");
                }
            }

            inventoryItems.Add(new InventoryItem
            {
                ItemName    = itemName,
                Quantity    = item.Quantity,
                Unit        = unit,
                Weight      = weight,
                Description = item.Description,
                AssetId     = assetId,
            });
        }

        var request = new InventoryRequest
        {
            RenterId    = cmd.RenterId,
            WarehouseId = cmd.WarehouseId,
            Type        = cmd.Type.ToUpper(),
            Notes       = string.IsNullOrWhiteSpace(cmd.Notes) ? null : $"Người thuê: {cmd.Notes}",
            DocumentUrls = cmd.DocumentUrls != null && cmd.DocumentUrls.Count > 0
                ? System.Text.Json.JsonSerializer.Serialize(cmd.DocumentUrls)
                : null,
            Status         = "PENDING",
            InventoryItems = inventoryItems,
            ScheduledDate  = cmd.ScheduledDate,
        };

        var created = await _repo.CreateAsync(request, cancellationToken);

        // Tự động tạo WarehouseTask + UnitTasks phản chiếu luồng nghiệp vụ
        var taskScheduledAt = cmd.ScheduledDate ?? created.CreatedAt ?? DateTime.Now;
        await _taskRepo.CreateWorkflowTaskAsync(
            cmd.Type.ToUpper(),
            created.InvReqId,
            cmd.WarehouseId,
            taskScheduledAt,
            cancellationToken);

        var full = await _repo.GetByIdAsync(created.InvReqId, cancellationToken);
        return InventoryRequestMapper.ToDto(full!);
    }
}
