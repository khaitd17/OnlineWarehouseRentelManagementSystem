using MediatR;
using WMS.Application.Features.ReceiptNotes.Shared;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.ReceiptNotes.ConfirmReceiptNote;

/// <summary>
/// Renter xác nhận phiếu nhập kho — đồng ý với kết quả kiểm đếm.
/// Phiếu chuyển từ VERIFIED → COMPLETED. Chữ ký Renter được lưu.
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

    public ConfirmReceiptNoteHandler(
        IReceiptNoteRepository receiptRepo,
        IInventoryRequestRepository requestRepo)
    {
        _receiptRepo = receiptRepo;
        _requestRepo = requestRepo;
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

        // Update phiếu
        note.Status = "COMPLETED";
        note.RenterSignatureBase64 = cmd.RenterSignatureBase64;
        note.UpdatedAt = DateTime.Now;
        await _receiptRepo.UpdateAsync(note, ct);

        // Kiểm tra: tất cả phiếu đã COMPLETED → có thể auto-complete yêu cầu gốc?
        var allNotes = await _receiptRepo.GetByRequestIdAsync(note.InvReqId, ct);
        bool allCompleted = allNotes.All(n => n.Status == "COMPLETED");

        if (allCompleted && allNotes.Count > 0)
        {
            var req = await _requestRepo.GetByIdAsync(note.InvReqId, ct);
            if (req != null && req.Status == "RECEIVING")
            {
                // Tính tổng đã nhận vs tổng yêu cầu
                var totalRequested = req.InventoryItems.Sum(i => i.Quantity);
                var totalReceived = allNotes.SelectMany(n => n.ReceiptItems).Sum(i => i.ReceivedQuantity);

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
