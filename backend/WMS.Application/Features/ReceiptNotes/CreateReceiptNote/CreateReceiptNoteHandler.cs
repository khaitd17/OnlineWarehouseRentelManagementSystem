using MediatR;
using WMS.Application.Features.ReceiptNotes.Shared;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.ReceiptNotes.CreateReceiptNote;

// ─── Input per item ──────────────────────────────────────────────────────────
public record CreateReceiptItemInput
{
    /// <summary>FK về InventoryItem gốc (nullable — cho hàng phát sinh).</summary>
    public int? InventoryItemId { get; init; }
    /// <summary>FK về RenterAsset (nullable).</summary>
    public int? AssetId { get; init; }
    public string ItemName { get; init; } = "";
    public int ExpectedQuantity { get; init; }
    public int ReceivedQuantity { get; init; }
    public string Unit { get; init; } = "cái";
    public decimal? VerifiedVolume { get; init; }
    public decimal? MeasuredLength { get; init; }
    public decimal? MeasuredWidth { get; init; }
    public decimal? VerifiedWeight { get; init; }
    public string? Note { get; init; }
}

// ─── Command ─────────────────────────────────────────────────────────────────
public record CreateReceiptNoteCommand : IRequest<ReceiptNoteDto>
{
    public int InvReqId { get; init; }
    public int StaffId { get; init; }
    public string? Notes { get; init; }
    public string? StaffSignatureBase64 { get; init; }
    public bool AcceptOverCapacity { get; init; } = false;
    public List<CreateReceiptItemInput> Items { get; init; } = new();
}

// ─── Handler ─────────────────────────────────────────────────────────────────
public class CreateReceiptNoteHandler
    : IRequestHandler<CreateReceiptNoteCommand, ReceiptNoteDto>
{
    private readonly IReceiptNoteRepository _receiptRepo;
    private readonly IInventoryRequestRepository _requestRepo;
    private readonly IWarehouseInventoryRepository _invRepo;
    private readonly IInventoryTransactionRepository _txRepo;
    private readonly IRenterAssetRepository _assetRepo;
    private readonly IRentalContractRepository _contractRepo;

    public CreateReceiptNoteHandler(
        IReceiptNoteRepository receiptRepo,
        IInventoryRequestRepository requestRepo,
        IWarehouseInventoryRepository invRepo,
        IInventoryTransactionRepository txRepo,
        IRenterAssetRepository assetRepo,
        IRentalContractRepository contractRepo)
    {
        _receiptRepo = receiptRepo;
        _requestRepo = requestRepo;
        _invRepo     = invRepo;
        _txRepo      = txRepo;
        _assetRepo   = assetRepo;
        _contractRepo= contractRepo;
    }

    public async Task<ReceiptNoteDto> Handle(
        CreateReceiptNoteCommand cmd, CancellationToken ct)
    {
        // 1. Load yêu cầu gốc
        var req = await _requestRepo.GetByIdAsync(cmd.InvReqId, ct)
            ?? throw new KeyNotFoundException($"Inventory request #{cmd.InvReqId} không tồn tại.");

        // 2. Validate trạng thái — phải đã được duyệt (CONFIRMED/ASSIGNED/RECEIVING)
        if (req.Status != "CONFIRMED" && req.Status != "ASSIGNED" && req.Status != "RECEIVING")
            throw new InvalidOperationException(
                $"Chỉ có thể tạo phiếu nhập khi yêu cầu ở trạng thái CONFIRMED, ASSIGNED hoặc RECEIVING. " +
                $"Trạng thái hiện tại: '{req.Status}'.");

        // 3. Sinh mã phiếu (ReceiptCode)
        var noteCount = await _receiptRepo.CountByRequestIdAsync(cmd.InvReqId, ct);
        var suffix = (char)('A' + noteCount);  // A, B, C, D...
        var receiptCode = $"RN-{req.RequestCode?.Replace("INB-", "").Replace("OUT-", "") ?? cmd.InvReqId.ToString()}-{suffix}";

        // 4. Build ReceiptItems
        var receiptItems = new List<ReceiptItem>();
        decimal totalVerifiedVolume = 0;
        
        foreach (var input in cmd.Items)
        {
            if (input.ReceivedQuantity < 0)
                throw new ArgumentException($"Số lượng thực nhận không được âm: '{input.ItemName}'.");

            if (input.ReceivedQuantity > 0 && (!input.VerifiedVolume.HasValue || input.VerifiedVolume.Value <= 0))
                throw new ArgumentException($"Vui lòng nhập diện tích (m²) > 0 cho mặt hàng thực nhận: '{input.ItemName}'.");

            if (input.ReceivedQuantity > 0 && input.VerifiedVolume.HasValue)
            {
                totalVerifiedVolume += input.VerifiedVolume.Value;
            }

            receiptItems.Add(new ReceiptItem
            {
                InventoryItemId  = input.InventoryItemId,
                AssetId          = input.AssetId,
                ItemName         = input.ItemName,
                ExpectedQuantity = input.ExpectedQuantity,
                ReceivedQuantity = input.ReceivedQuantity,
                Unit             = input.Unit,
                VerifiedVolume   = input.VerifiedVolume,
                MeasuredLength    = input.MeasuredLength,
                MeasuredWidth     = input.MeasuredWidth,
                VerifiedWeight   = input.VerifiedWeight,
                Note             = string.IsNullOrWhiteSpace(input.Note) ? null : input.Note.Trim(),
            });
        }

        // ── 4b. Capacity Guard — 3 vùng kiểm soát ──────────────────────────
        // Ngưỡng cố định 2 m² (không dùng phần trăm)
        const decimal OVERFLOW_TOLERANCE = 2.0m;
        decimal capacityOverflow = 0;
        string receiptStatus = "VERIFIED"; // mặc định: Staff đã kiểm đếm xong
        string? capacityNote = null;

        if (req.Type == "INBOUND")
        {
            var contractedArea = await _contractRepo.GetContractedAreaAsync(
                req.RenterId, req.WarehouseId, ct);

            if (contractedArea > 0)
            {
                var usedArea = await _assetRepo.GetUsedAreaAsync(
                    req.RenterId, req.WarehouseId, ct);
                var remainingArea = (decimal)contractedArea - usedArea;
                var overflow = totalVerifiedVolume - remainingArea;

                if (overflow > 0)
                {
                    capacityOverflow = overflow;

                    if (overflow > OVERFLOW_TOLERANCE)
                    {
                        // VÙNG ĐỎ — Vượt nghiêm trọng (> 2 m²) → HARD BLOCK
                        // Phiếu vẫn được tạo nhưng trạng thái = PENDING_CAPACITY_APPROVAL
                        // Tồn kho KHÔNG được cập nhật cho đến khi Manager duyệt
                        receiptStatus = "PENDING_CAPACITY_APPROVAL";
                        capacityNote = $"[VƯỢT SỨC CHỨA NGHIÊM TRỌNG] " +
                            $"Vượt {overflow:N2} m² so với hợp đồng. " +
                            $"Đã dùng: {usedArea:N2}/{contractedArea:N2} m². " +
                            $"Phiếu này: {totalVerifiedVolume:N2} m². " +
                            $"Chờ Manager phê duyệt.";
                    }
                    else if (cmd.AcceptOverCapacity)
                    {
                        // VÙNG VÀNG — Vượt nhẹ (<= 2 m²), Thủ kho đã xác nhận
                        receiptStatus = "VERIFIED";
                        capacityNote = $"[Vượt nhẹ {overflow:N2} m²] " +
                            $"Thủ kho đã xác nhận chấp nhận.";
                    }
                    else
                    {
                        // VÙNG VÀNG — Chưa xác nhận
                        throw new InvalidOperationException(
                            $"Diện tích thực nhận vượt {overflow:N2} m² so với " +
                            $"diện tích còn trống ({remainingArea:N2} m²). " +
                            $"Đã dùng: {usedArea:N2}/{contractedArea:N2} m². " +
                            $"Vui lòng xác nhận chấp nhận vượt sức chứa.");
                    }
                }
            }
        }

        // 5. Tạo ReceiptNote
        var combinedNotes = cmd.Notes;
        if (!string.IsNullOrEmpty(capacityNote))
        {
            combinedNotes = string.IsNullOrEmpty(combinedNotes)
                ? capacityNote
                : $"{combinedNotes}\n{capacityNote}";
        }

        var note = new ReceiptNote
        {
            InvReqId            = cmd.InvReqId,
            ReceiptCode         = receiptCode,
            ReceivedByStaffId   = cmd.StaffId,
            ReceivedAt          = DateTime.Now,
            StaffSignatureBase64 = cmd.StaffSignatureBase64,
            Status              = receiptStatus,
            Notes               = combinedNotes,
            CapacityOverflow    = capacityOverflow > 0 ? capacityOverflow : null,
            ReceiptItems        = receiptItems,
        };

        var created = await _receiptRepo.CreateAsync(note, ct);

        // 6. Cập nhật inventory — BỎ QUA nếu phiếu đang chờ Manager duyệt
        //    Khi status = PENDING_CAPACITY_APPROVAL, tồn kho KHÔNG được cập nhật
        //    cho đến khi Manager phê duyệt phiếu này.
        if (receiptStatus != "PENDING_CAPACITY_APPROVAL")
        {
        // Tồn kho cộng/trừ theo ReceivedQuantity
        foreach (var item in receiptItems)
        {
            if (item.ReceivedQuantity <= 0) continue;

            int delta = req.Type == "OUTBOUND" ? -item.ReceivedQuantity : item.ReceivedQuantity;

            // Warehouse inventory (text-based)
            await _invRepo.AdjustQuantityAsync(
                req.WarehouseId, item.ItemName, item.Unit, delta, ct);

            // Resolve AssetId
            int resolvedAssetId;
            if (item.AssetId.HasValue && item.AssetId.Value > 0)
            {
                resolvedAssetId = item.AssetId.Value;
            }
            else
            {
                var existing = await _assetRepo.FindByNameAndRenterAsync(
                    req.RenterId, item.ItemName, ct);
                if (existing != null)
                {
                    resolvedAssetId = existing.AssetId;
                }
                else
                {
                    var newAsset = await _assetRepo.CreateAsync(new RenterAsset
                    {
                        RenterId  = req.RenterId,
                        AssetName = item.ItemName,
                        Unit      = item.Unit,
                    }, ct);
                    resolvedAssetId = newAsset.AssetId;
                }
                item.AssetId = resolvedAssetId;
            }

            // Renter inventory (asset-based)
            await _assetRepo.AdjustRenterInventoryAsync(
                resolvedAssetId, req.WarehouseId, delta, ct);

            // Update cached measurement data of Asset if provided.
            if (item.ReceivedQuantity > 0 &&
                (item.VerifiedVolume.HasValue || item.MeasuredLength.HasValue || item.MeasuredWidth.HasValue))
            {
                var asset = await _assetRepo.GetByIdAsync(resolvedAssetId, ct);
                if (asset != null)
                {
                    var changed = false;
                    if (item.VerifiedVolume.HasValue)
                    {
                        decimal calcVolumePerUnit = item.VerifiedVolume.Value / item.ReceivedQuantity;
                        if (asset.VolumePerUnit == null || asset.VolumePerUnit != calcVolumePerUnit)
                        {
                            asset.VolumePerUnit = calcVolumePerUnit;
                            changed = true;
                        }
                    }

                    if (item.MeasuredLength.HasValue && item.MeasuredLength.Value > 0 &&
                        (asset.LengthPerUnit == null || asset.LengthPerUnit != item.MeasuredLength.Value))
                    {
                        asset.LengthPerUnit = item.MeasuredLength.Value;
                        changed = true;
                    }

                    if (item.MeasuredWidth.HasValue && item.MeasuredWidth.Value > 0 &&
                        (asset.WidthPerUnit == null || asset.WidthPerUnit != item.MeasuredWidth.Value))
                    {
                        asset.WidthPerUnit = item.MeasuredWidth.Value;
                        changed = true;
                    }

                    if (changed)
                        await _assetRepo.UpdateAsync(asset, ct);
                }
            }

            // Transaction record — gắn ReceiptNoteId
            await _txRepo.CreateAsync(new InventoryTransaction
            {
                InvReqId      = req.InvReqId,
                Type          = req.Type,
                WarehouseId   = req.WarehouseId,
                ItemName      = item.ItemName,
                Quantity      = item.ReceivedQuantity,
                Unit          = item.Unit,
                PerformedBy   = cmd.StaffId,
                ReceiptNoteId = created.ReceiptNoteId,
                Notes         = item.Note,
            }, ct);
        }
        } // end if (receiptStatus != "PENDING_CAPACITY_APPROVAL")
        // 7. Cập nhật trạng thái yêu cầu → RECEIVING (nếu chưa)
        if (req.Status != "RECEIVING")
        {
            req.Status = "RECEIVING";
            req.UpdatedAt = DateTime.Now;
            await _requestRepo.UpdateAsync(req, ct);
        }

        // 8. Load lại phiếu đầy đủ
        var full = await _receiptRepo.GetByIdAsync(created.ReceiptNoteId, ct);
        return ReceiptNoteMapper.ToDto(full!);
    }
}
