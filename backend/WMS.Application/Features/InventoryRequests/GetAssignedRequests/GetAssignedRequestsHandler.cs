using MediatR;
using WMS.Application.Features.InventoryRequests.Shared;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.InventoryRequests.GetAssignedRequests;

// ─── Query ───────────────────────────────────────────────────────────────────
public record GetAssignedRequestsQuery : IRequest<List<InventoryRequestDto>>
{
    public int StaffId { get; init; }
    /// <summary>Optional type filter: INBOUND | OUTBOUND | null (all)</summary>
    public string? Type { get; init; }
}

// ─── Handler ─────────────────────────────────────────────────────────────────
public class GetAssignedRequestsHandler
    : IRequestHandler<GetAssignedRequestsQuery, List<InventoryRequestDto>>
{
    private readonly IInventoryRequestRepository _repo;

    public GetAssignedRequestsHandler(IInventoryRequestRepository repo)
        => _repo = repo;

    public async Task<List<InventoryRequestDto>> Handle(
        GetAssignedRequestsQuery query, CancellationToken cancellationToken)
    {
        var requests = await _repo.GetAssignedToStaffAsync(query.StaffId, cancellationToken);

        if (!string.IsNullOrEmpty(query.Type))
            requests = requests.Where(r => r.Type == query.Type.ToUpper()).ToList();

        return requests.Select(InventoryRequestMapper.ToDto).ToList();
    }
}
