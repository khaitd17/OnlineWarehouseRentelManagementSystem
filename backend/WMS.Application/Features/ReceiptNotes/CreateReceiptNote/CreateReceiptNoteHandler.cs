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

    public CreateReceiptNoteHandler(
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
        foreach (var input in cmd.Items)
        {
            if (input.ReceivedQuantity < 0)
                throw new ArgumentException($"Số lượng thực nhận không được âm: '{input.ItemName}'.");

            receiptItems.Add(new ReceiptItem
            {
                InventoryItemId  = input.InventoryItemId,
                AssetId          = input.AssetId,
                ItemName         = input.ItemName,
                ExpectedQuantity = input.ExpectedQuantity,
                ReceivedQuantity = input.ReceivedQuantity,
                Unit             = input.Unit,
                VerifiedVolume   = input.VerifiedVolume,
                VerifiedWeight   = input.VerifiedWeight,
                Note             = string.IsNullOrWhiteSpace(input.Note) ? null : input.Note.Trim(),
            });
        }

        // 5. Tạo ReceiptNote
        var note = new ReceiptNote
        {
            InvReqId            = cmd.InvReqId,
            ReceiptCode         = receiptCode,
            ReceivedByStaffId   = cmd.StaffId,
            ReceivedAt          = DateTime.Now,
            StaffSignatureBase64 = cmd.StaffSignatureBase64,
            Status              = "VERIFIED",   // Staff đã kiểm đếm xong → chờ Renter xác nhận
            Notes               = cmd.Notes,
            ReceiptItems        = receiptItems,
        };

        var created = await _receiptRepo.CreateAsync(note, ct);

        // 6. Cập nhật inventory ngay khi phiếu tạo (Staff đã kiểm đếm)
        //    → Tồn kho cộng/trừ theo ReceivedQuantity
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
