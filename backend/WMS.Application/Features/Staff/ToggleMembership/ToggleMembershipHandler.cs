using MediatR;
using WMS.Application.Interfaces;

namespace WMS.Application.Features.Staff.ToggleMembership;

public class ToggleMembershipHandler : IRequestHandler<ToggleMembershipCommand, Unit>
{
    private readonly IStaffMembershipRepository _repo;

    public ToggleMembershipHandler(IStaffMembershipRepository repo)
    {
        _repo = repo;
    }

    public async Task<Unit> Handle(
        ToggleMembershipCommand request,
        CancellationToken cancellationToken)
    {
        await _repo.SetActiveAsync(request.MembershipId, request.SetActive, cancellationToken);
        return Unit.Value;
    }
}
