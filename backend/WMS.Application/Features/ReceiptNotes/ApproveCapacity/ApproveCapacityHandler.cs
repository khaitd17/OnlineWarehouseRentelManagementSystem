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
            // ── DUYỆT — Chỉ chuyển trạng thái, KHÔNG cập nhật tồn kho ──
            // Tồn kho sẽ được cập nhật khi Người thuê ký xác nhận phiếu
            // (VERIFIED → COMPLETED) trong ConfirmReceiptNoteHandler.
            note.Status = "VERIFIED";
            note.Notes = (note.Notes ?? "") + $"\n[Manager duyệt] ID={cmd.ManagerId}";
            note.UpdatedAt = DateTime.Now;
            await _receiptRepo.UpdateAsync(note, ct);

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
