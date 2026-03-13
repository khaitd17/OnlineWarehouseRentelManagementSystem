using MediatR;

namespace WMS.Application.Features.Staff.ToggleMembership;

public class ToggleMembershipCommand : IRequest<Unit>
{
    public int MembershipId { get; set; }
    public bool SetActive { get; set; }
}
