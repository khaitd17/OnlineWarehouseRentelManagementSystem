using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Shifts.SaveShifts;

public class SaveShiftsHandler : IRequestHandler<SaveShiftsCommand>
{
    private readonly IStaffShiftRepository _repo;
    private readonly IStaffMembershipRepository _membershipRepo;

    public SaveShiftsHandler(IStaffShiftRepository repo, IStaffMembershipRepository membershipRepo)
    {
        _repo = repo;
        _membershipRepo = membershipRepo;
    }

    public async Task Handle(SaveShiftsCommand request, CancellationToken ct)
    {
        if (request.WarehouseId.HasValue)
        {
            var membership = await _membershipRepo.GetCallerMembershipAsync(
                request.CallerId, request.WarehouseId.Value, ct);
            if (membership == null || membership.RoleCode is not ("MANAGER" or "OPERATOR"))
                throw new UnauthorizedAccessException("Chỉ MANAGER / OPERATOR được lưu lịch ca.");
        }

        await _repo.SaveShiftsAsync(request.Shifts, ct);
    }
}
