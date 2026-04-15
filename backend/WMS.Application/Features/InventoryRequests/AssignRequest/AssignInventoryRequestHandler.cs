using MediatR;
using WMS.Application.Features.InventoryRequests.Shared;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.InventoryRequests.AssignRequest;

// ─── Command ─────────────────────────────────────────────────────────────────
public record AssignInventoryRequestCommand : IRequest<InventoryRequestDto>
{
    public int Id        { get; init; }
    public int ManagerId { get; init; }
    public int StaffId   { get; init; }
    public string? Note  { get; init; }
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

        if (req.Status != "CONFIRMED")
            throw new InvalidOperationException(
                $"Chỉ có thể giao yêu cầu đã được duyệt (CONFIRMED). Trạng thái hiện tại: '{req.Status}'.");

        req.AssignedStaffId = cmd.StaffId;
        req.AssignedNote    = cmd.Note;
        req.AssignedAt      = DateTime.Now;
        req.Status          = "ASSIGNED";
        req.UpdatedAt       = DateTime.Now;

        await _repo.UpdateAsync(req, cancellationToken);

        var updated = await _repo.GetByIdAsync(req.InvReqId, cancellationToken);
        return InventoryRequestMapper.ToDto(updated!);
    }
}
