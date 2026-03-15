using MediatR;
using WMS.Application.Interfaces;

namespace WMS.Application.Features.Tasks.AssignTask;

public class GetEligibleStaffHandler : IRequestHandler<GetEligibleStaffQuery, List<EligibleStaffResult>>
{
    private readonly ITaskRepository _repo;

    public GetEligibleStaffHandler(ITaskRepository repo) => _repo = repo;

    public async Task<List<EligibleStaffResult>> Handle(GetEligibleStaffQuery query, CancellationToken ct)
    {
        var staff = await _repo.GetEligibleStaffAsync(query.TaskId, ct);
        return staff.Select(s => new EligibleStaffResult
        {
            MembershipId = s.MembershipId,
            FullName     = s.FullName,
            Email        = s.Email,
            RoleCode     = s.RoleCode,
            Skills       = s.Skills,
        }).ToList();
    }
}
