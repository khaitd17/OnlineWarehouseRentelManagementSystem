using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Shifts.GetMySchedule;

public class GetMyScheduleHandler : IRequestHandler<GetMyScheduleCommand, StaffScheduleDto?>
{
    private readonly IStaffShiftRepository _repo;

    public GetMyScheduleHandler(IStaffShiftRepository repo) => _repo = repo;

    public Task<StaffScheduleDto?> Handle(GetMyScheduleCommand cmd, CancellationToken ct)
        => _repo.GetMyScheduleAsync(cmd.CallerId, cmd.WarehouseId, cmd.From, cmd.To, ct);
}
