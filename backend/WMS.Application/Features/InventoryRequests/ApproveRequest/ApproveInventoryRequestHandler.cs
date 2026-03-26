using MediatR;
using WMS.Application.Features.InventoryRequests.Shared;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.InventoryRequests.ApproveRequest;

// ─── Command ─────────────────────────────────────────────────────────────────
public record ApproveInventoryRequestCommand : IRequest<InventoryRequestDto>
{
    public int     Id        { get; init; }
    public int     ManagerId { get; init; }
    public string? Note      { get; init; }
}

// ─── Handler ─────────────────────────────────────────────────────────────────
public class ApproveInventoryRequestHandler
    : IRequestHandler<ApproveInventoryRequestCommand, InventoryRequestDto>
{
    private readonly IInventoryRequestRepository _repo;

    public ApproveInventoryRequestHandler(IInventoryRequestRepository repo)
        => _repo = repo;

    public async Task<InventoryRequestDto> Handle(
        ApproveInventoryRequestCommand cmd, CancellationToken cancellationToken)
    {
        var req = await _repo.GetByIdAsync(cmd.Id, cancellationToken)
            ?? throw new KeyNotFoundException($"Request {cmd.Id} not found.");

        if (req.Status != "PENDING")
            throw new InvalidOperationException(
                $"Chỉ có thể duyệt yêu cầu đang ở trạng thái PENDING. Trạng thái hiện tại: '{req.Status}'.");

        req.Status    = "CONFIRMED";
        req.UpdatedAt = DateTime.Now;

        // Ghi chú phê duyệt (append vào Notes nếu có)
        if (!string.IsNullOrWhiteSpace(cmd.Note))
            req.Notes = string.IsNullOrEmpty(req.Notes)
                ? $"[ĐÃ DUYỆT] {cmd.Note}"
                : $"[ĐÃ DUYỆT] {cmd.Note}\n{req.Notes}";

        await _repo.UpdateAsync(req, cancellationToken);

        var updated = await _repo.GetByIdAsync(req.InvReqId, cancellationToken);
        return InventoryRequestMapper.ToDto(updated!);
    }
}
