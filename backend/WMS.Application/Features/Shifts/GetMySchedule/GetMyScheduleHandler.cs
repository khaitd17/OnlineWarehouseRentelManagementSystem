using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Shifts.GetMySchedule;

public class GetMyScheduleQuery : IRequest<StaffScheduleDto?>
{
    public int CallerId { get; set; }
    public int WarehouseId { get; set; }
    public DateOnly From { get; set; }
    public DateOnly To { get; set; }
}

public class GetMyScheduleHandler : IRequestHandler<GetMyScheduleQuery, StaffScheduleDto?>
{
    private readonly IStaffShiftRepository _repo;

    public GetMyScheduleHandler(IStaffShiftRepository repo) => _repo = repo;

    public Task<StaffScheduleDto?> Handle(GetMyScheduleQuery q, CancellationToken ct)
        => _repo.GetMyScheduleAsync(q.CallerId, q.WarehouseId, q.From, q.To, ct);
}
