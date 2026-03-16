using MediatR;

namespace WMS.Application.Features.Tasks.AssignTask;

public class AssignStaffCommand : IRequest<Unit>
{
    public int TaskId { get; set; }
    public List<int> MembershipIds { get; set; } = new();
}

public class GetEligibleStaffQuery : IRequest<List<EligibleStaffResult>>
{
    public int TaskId { get; set; }
}

public class EligibleStaffResult
{
    public int MembershipId { get; set; }
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string RoleCode { get; set; } = null!;
    public List<string> Skills { get; set; } = new();
}
