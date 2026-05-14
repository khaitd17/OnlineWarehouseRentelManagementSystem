using MediatR;
using WMS.Application.Features.ReceiptNotes.Shared;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.ReceiptNotes.ApproveCapacity;

// ─── Command ─────────────────────────────────────────────────────────────────
public record ApproveCapacityCommand : IRequest<ReceiptNoteDto>
{
    public int ReceiptNoteId { get; init; }
    public int ManagerId { get; init; }
    public bool Approve { get; init; } // true = duyệt, false = từ chối
    public string? Reason { get; init; }
}

// ─── Handler ─────────────────────────────────────────────────────────────────
public class ApproveCapacityHandler : IRequestHandler<ApproveCapacityCommand, ReceiptNoteDto>
{
    private readonly IReceiptNoteRepository _receiptRepo;
    private readonly IInventoryRequestRepository _requestRepo;
    private readonly IWarehouseInventoryRepository _invRepo;
    private readonly IInventoryTransactionRepository _txRepo;
    private readonly IRenterAssetRepository _assetRepo;

    public ApproveCapacityHandler(
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

    public async Task<ReceiptNoteDto> Handle(ApproveCapacityCommand cmd, CancellationToken ct)
    {
        // 1. Load phiếu
        var note = await _receiptRepo.GetByIdAsync(cmd.ReceiptNoteId, ct)
            ?? throw new KeyNotFoundException($"Phiếu #{cmd.ReceiptNoteId} không tồn tại.");

        if (note.Status != "PENDING_CAPACITY_APPROVAL")
            throw new InvalidOperationException(
                $"Phiếu đang ở trạng thái '{note.Status}', không cần duyệt sức chứa.");

        var req = await _requestRepo.GetByIdAsync(note.InvReqId, ct)
            ?? throw new KeyNotFoundException($"Yêu cầu #{note.InvReqId} không tồn tại.");

        if (cmd.Approve)
        {
            // ── DUYỆT — Cập nhật trạng thái và tồn kho ──
            note.Status = "VERIFIED";
            note.Notes = (note.Notes ?? "") + $"\n[Manager duyệt] ID={cmd.ManagerId}";
            note.UpdatedAt = DateTime.Now;
            await _receiptRepo.UpdateAsync(note, ct);

            // Cập nhật tồn kho — logic giống CreateReceiptNoteHandler
            foreach (var item in note.ReceiptItems)
            {
                if (item.ReceivedQuantity <= 0) continue;

                int delta = req.Type == "OUTBOUND" ? -item.ReceivedQuantity : item.ReceivedQuantity;

                // Warehouse inventory
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

                // Renter inventory
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

                // Transaction record
                await _txRepo.CreateAsync(new InventoryTransaction
                {
                    InvReqId      = req.InvReqId,
                    Type          = req.Type,
                    WarehouseId   = req.WarehouseId,
                    ItemName      = item.ItemName,
                    Quantity      = item.ReceivedQuantity,
                    Unit          = item.Unit,
                    PerformedBy   = cmd.ManagerId,
                    ReceiptNoteId = note.ReceiptNoteId,
                    Notes         = $"[Capacity approved] {item.Note}",
                }, ct);
            }

            // Cập nhật request status
            if (req.Status != "RECEIVING")
            {
                req.Status = "RECEIVING";
                req.UpdatedAt = DateTime.Now;
                await _requestRepo.UpdateAsync(req, ct);
            }
        }
        else
        {
            // ── TỪ CHỐI — Hủy phiếu ──
            note.Status = "REJECTED";
            note.Notes = (note.Notes ?? "") + $"\n[Manager từ chối] Lý do: {cmd.Reason ?? "Không rõ"}";
            note.UpdatedAt = DateTime.Now;
            await _receiptRepo.UpdateAsync(note, ct);
        }

        var full = await _receiptRepo.GetByIdAsync(note.ReceiptNoteId, ct);
        return ReceiptNoteMapper.ToDto(full!);
    }
}
