using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Shifts.GetShifts;

public class GetShiftsHandler : IRequestHandler<GetShiftsCommand, List<StaffShiftDto>>
{
    private readonly IStaffShiftRepository _repo;

    public GetShiftsHandler(IStaffShiftRepository repo) => _repo = repo;

    public Task<List<StaffShiftDto>> Handle(GetShiftsCommand cmd, CancellationToken cancellationToken)
        => _repo.GetShiftsAsync(cmd.WarehouseId, cmd.From, cmd.To, cancellationToken);
}
