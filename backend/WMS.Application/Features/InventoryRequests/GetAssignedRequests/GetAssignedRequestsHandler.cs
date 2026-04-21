using MediatR;
using WMS.Application.Features.InventoryRequests.Shared;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.InventoryRequests.GetAssignedRequests;

// ─── Query ───────────────────────────────────────────────────────────────────
public record GetAssignedRequestsQuery : IRequest<List<InventoryRequestDto>>
{
    public int StaffId    { get; init; }
    public int WarehouseId { get; init; }
    public string? Type   { get; init; }
}

// ─── Handler ─────────────────────────────────────────────────────────────────
public class GetAssignedRequestsHandler
    : IRequestHandler<GetAssignedRequestsQuery, List<InventoryRequestDto>>
{
    private readonly IInventoryRequestRepository _repo;
    private readonly IStaffMembershipRepository _membershipRepo;

    public GetAssignedRequestsHandler(
        IInventoryRequestRepository repo,
        IStaffMembershipRepository membershipRepo)
    {
        _repo = repo;
        _membershipRepo = membershipRepo;
    }

    public async Task<List<InventoryRequestDto>> Handle(
        GetAssignedRequestsQuery query, CancellationToken cancellationToken)
    {
        var assignedRequests = await _repo.GetAssignedToStaffByWarehouseAsync(
            query.StaffId, query.WarehouseId, query.Type, cancellationToken);

        var results = assignedRequests.ToList();

        var staffMembership = await _membershipRepo.GetMembershipByRoleAsync(
            query.StaffId, query.WarehouseId, "STAFF", cancellationToken);

        if (staffMembership?.HasSkill("CHECKER") == true)
        {
            var confirmedRequests = await _repo.GetConfirmedByWarehouseAsync(
                query.WarehouseId, query.Type, cancellationToken);

            foreach (var request in confirmedRequests)
            {
                if (results.All(r => r.InvReqId != request.InvReqId))
                {
                    results.Add(request);
                }
            }
        }

        return results.Select(InventoryRequestMapper.ToDto).ToList();
    }
}
