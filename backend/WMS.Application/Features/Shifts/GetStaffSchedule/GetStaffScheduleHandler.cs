using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Shifts.GetStaffSchedule;

public class GetStaffScheduleHandler : IRequestHandler<GetStaffScheduleCommand, List<StaffScheduleDto>>
{
    private readonly IStaffShiftRepository _repo;

    public GetStaffScheduleHandler(IStaffShiftRepository repo) => _repo = repo;

    public Task<List<StaffScheduleDto>> Handle(GetStaffScheduleCommand cmd, CancellationToken ct)
        => _repo.GetStaffScheduleAsync(cmd.WarehouseId, cmd.CallerId, cmd.From, cmd.To, ct);
}
