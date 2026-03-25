using MediatR;
using WMS.Application.Features.InventoryRequests.Shared;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.InventoryRequests.RejectRequest;

// ─── Command ─────────────────────────────────────────────────────────────────
public record RejectInventoryRequestCommand : IRequest<InventoryRequestDto>
{
    public int Id { get; init; }
    public int ManagerId { get; init; }
    public string? Reason { get; init; }
}

// ─── Handler ─────────────────────────────────────────────────────────────────
public class RejectInventoryRequestHandler
    : IRequestHandler<RejectInventoryRequestCommand, InventoryRequestDto>
{
    private readonly IInventoryRequestRepository _repo;

    public RejectInventoryRequestHandler(IInventoryRequestRepository repo)
        => _repo = repo;

    public async Task<InventoryRequestDto> Handle(
        RejectInventoryRequestCommand cmd, CancellationToken cancellationToken)
    {
        var req = await _repo.GetByIdAsync(cmd.Id, cancellationToken)
            ?? throw new KeyNotFoundException($"Request {cmd.Id} not found.");

        if (req.Status != "PENDING")
            throw new InvalidOperationException(
                $"Chỉ có thể từ chối yêu cầu đang ở trạng thái PENDING. Trạng thái hiện tại: '{req.Status}'.");

        req.Status    = "REJECTED";
        req.Notes     = string.IsNullOrEmpty(cmd.Reason)
            ? req.Notes
            : $"[TỪ CHỐI] {cmd.Reason}\n{req.Notes}";
        req.UpdatedAt = DateTime.Now;

        await _repo.UpdateAsync(req, cancellationToken);

        var updated = await _repo.GetByIdAsync(req.InvReqId, cancellationToken);
        return InventoryRequestMapper.ToDto(updated!);
    }
}
