using MediatR;
using WMS.Application.Features.ReceiptNotes.Shared;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.ReceiptNotes.ConfirmReceiptNote;

/// <summary>
/// Renter xác nhận phiếu nhập/xuất kho — đồng ý với kết quả kiểm đếm.
/// Phiếu chuyển từ VERIFIED → COMPLETED.
/// Chữ ký Renter được lưu.
/// Tồn kho được cập nhật tại đây (thời điểm duy nhất).
/// </summary>
public record ConfirmReceiptNoteCommand : IRequest<ReceiptNoteDto>
{
    public int ReceiptNoteId { get; init; }
    public int RenterId { get; init; }
    public string? RenterSignatureBase64 { get; init; }
}

public class ConfirmReceiptNoteHandler
    : IRequestHandler<ConfirmReceiptNoteCommand, ReceiptNoteDto>
{
    private readonly IReceiptNoteRepository _receiptRepo;
    private readonly IInventoryRequestRepository _requestRepo;
    private readonly IWarehouseInventoryRepository _invRepo;
    private readonly IInventoryTransactionRepository _txRepo;
    private readonly IRenterAssetRepository _assetRepo;

    public ConfirmReceiptNoteHandler(
        IReceiptNoteRepository receiptRepo,
        IInventoryRequestRepository requestRepo,
        IWarehouseInventoryRepository invRepo,
        IInventoryTransactionRepository txRepo,
        IRenterAssetRepository assetRepo)
    {
        _receiptRepo = receiptRepo;
        _requestRepo = requestRepo;
        _invRepo     = invRepo;
        _txRepo      = txRepo;
        _assetRepo   = assetRepo;
    }

    public async Task<ReceiptNoteDto> Handle(
        ConfirmReceiptNoteCommand cmd, CancellationToken ct)
    {
        var note = await _receiptRepo.GetByIdAsync(cmd.ReceiptNoteId, ct)
            ?? throw new KeyNotFoundException($"Phiếu nhập #{cmd.ReceiptNoteId} không tồn tại.");

        // Validate: chỉ VERIFIED mới confirm được
        if (note.Status != "VERIFIED")
            throw new InvalidOperationException(
                $"Chỉ có thể xác nhận phiếu ở trạng thái VERIFIED. Trạng thái hiện tại: '{note.Status}'.");

        // Validate: chỉ Renter của yêu cầu gốc mới được confirm
        if (note.InvReq.RenterId != cmd.RenterId)
            throw new UnauthorizedAccessException("Bạn không phải là người thuê của yêu cầu này.");

        // Load yêu cầu gốc
        var req = await _requestRepo.GetByIdAsync(note.InvReqId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu #{note.InvReqId} không tồn tại.");

        // ── Cập nhật trạng thái phiếu ──
        note.Status = "COMPLETED";
        note.RenterSignatureBase64 = cmd.RenterSignatureBase64;
        note.UpdatedAt = DateTime.Now;
        await _receiptRepo.UpdateAsync(note, ct);

        // ── Cập nhật tồn kho — thời điểm duy nhất tồn kho được thay đổi ──
        foreach (var item in note.ReceiptItems)
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
            if (item.VerifiedVolume.HasValue || item.MeasuredLength.HasValue || item.MeasuredWidth.HasValue)
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
                PerformedBy   = cmd.RenterId,
                ReceiptNoteId = note.ReceiptNoteId,
                Notes         = item.Note,
            }, ct);
        }

        // ── Cập nhật VerifiedQuantity trên InventoryItem gốc ──
        // Tổng hợp ReceivedQuantity từ tất cả phiếu COMPLETED cho từng InventoryItem
        var allNotes = await _receiptRepo.GetByRequestIdAsync(note.InvReqId, ct);
        var completedNotes = allNotes.Where(n => n.Status == "COMPLETED").ToList();

        // Tính tổng ReceivedQuantity per InventoryItemId từ tất cả phiếu COMPLETED
        var receivedByItem = completedNotes
            .SelectMany(n => n.ReceiptItems)
            .Where(ri => ri.InventoryItemId.HasValue)
            .GroupBy(ri => ri.InventoryItemId!.Value)
            .ToDictionary(g => g.Key, g => g.Sum(ri => ri.ReceivedQuantity));

        foreach (var invItem in req.InventoryItems)
        {
            var totalReceived = receivedByItem.GetValueOrDefault(invItem.ItemId, 0);
            if (totalReceived > 0 && invItem.VerifiedQuantity != totalReceived)
            {
                invItem.VerifiedQuantity = totalReceived;
            }
        }
        await _requestRepo.UpdateAsync(req, ct);

        // ── Kiểm tra auto-complete yêu cầu gốc ──
        bool allCompleted = allNotes.All(n => n.Status == "COMPLETED");

        if (allCompleted && allNotes.Count > 0)
        {
            if (req.Status == "RECEIVING")
            {
                // Tính tổng đã nhận vs tổng yêu cầu
                var totalRequested = req.InventoryItems.Sum(i => i.Quantity);
                var totalReceived = completedNotes.SelectMany(n => n.ReceiptItems).Sum(i => i.ReceivedQuantity);

                // Auto-complete nếu đã nhận >= yêu cầu
                if (totalReceived >= totalRequested)
                {
                    req.Status = "COMPLETED";
                    req.UpdatedAt = DateTime.Now;
                    await _requestRepo.UpdateAsync(req, ct);
                }
            }
        }

        var full = await _receiptRepo.GetByIdAsync(cmd.ReceiptNoteId, ct);
        return ReceiptNoteMapper.ToDto(full!);
    }
}
