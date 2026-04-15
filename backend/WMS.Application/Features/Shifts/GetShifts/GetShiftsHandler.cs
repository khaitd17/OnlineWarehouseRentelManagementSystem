using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Shifts.GetShifts;

public class GetShiftsHandler : IRequestHandler<GetShiftsCommand, List<StaffShiftDto>>
{
    private readonly IStaffShiftRepository _repo;
    private readonly IStaffMembershipRepository _membershipRepo;

    public GetShiftsHandler(IStaffShiftRepository repo, IStaffMembershipRepository membershipRepo)
    {
        _repo = repo;
        _membershipRepo = membershipRepo;
    }

    public async Task<List<StaffShiftDto>> Handle(GetShiftsCommand cmd, CancellationToken cancellationToken)
    {
        var membership = await _membershipRepo.GetCallerMembershipAsync(cmd.CallerId, cmd.WarehouseId, cancellationToken);
        if (membership == null)
            throw new UnauthorizedAccessException("Bạn không có quyền truy cập lịch ca của kho này.");

        return await _repo.GetShiftsAsync(cmd.WarehouseId, cmd.From, cmd.To, cancellationToken);
    }
}
