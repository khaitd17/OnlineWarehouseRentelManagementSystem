using MediatR;
using WMS.Application.Features.InventoryRequests.Shared;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.InventoryRequests.AssignRequest;

// ─── Command ─────────────────────────────────────────────────────────────────
public record AssignInventoryRequestCommand : IRequest<InventoryRequestDto>
{
    public int Id { get; init; }
    /// <summary>UserId of the Manager/Owner performing the assignment</summary>
    public int ManagerId { get; init; }
    /// <summary>UserId of the Staff being assigned</summary>
    public int AssignedStaffId { get; init; }
    public string? AssignedNote { get; init; }
}

// ─── Handler ─────────────────────────────────────────────────────────────────
public class AssignInventoryRequestHandler
    : IRequestHandler<AssignInventoryRequestCommand, InventoryRequestDto>
{
    private readonly IInventoryRequestRepository _repo;

    public AssignInventoryRequestHandler(IInventoryRequestRepository repo)
        => _repo = repo;

    public async Task<InventoryRequestDto> Handle(
        AssignInventoryRequestCommand cmd, CancellationToken cancellationToken)
    {
        var req = await _repo.GetByIdAsync(cmd.Id, cancellationToken)
            ?? throw new KeyNotFoundException($"Request {cmd.Id} not found.");

        if (req.Status != "PENDING" && req.Status != "CONFIRMED")
            throw new InvalidOperationException(
                $"Chỉ có thể giao yêu cầu ở trạng thái PENDING hoặc CONFIRMED. Trạng thái hiện tại: '{req.Status}'.");

        req.Status          = "ASSIGNED";
        req.AssignedStaffId = cmd.AssignedStaffId;
        req.AssignedNote    = cmd.AssignedNote;
        req.AssignedAt      = DateTime.Now;
        req.UpdatedAt       = DateTime.Now;

        await _repo.UpdateAsync(req, cancellationToken);

        var updated = await _repo.GetByIdAsync(req.InvReqId, cancellationToken);
        return InventoryRequestMapper.ToDto(updated!);
    }
}
