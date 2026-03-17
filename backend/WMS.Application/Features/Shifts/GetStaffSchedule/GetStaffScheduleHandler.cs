using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Shifts.GetStaffSchedule;

public class GetStaffScheduleQuery : IRequest<List<StaffScheduleDto>>
{
    public int CallerId { get; set; }
    public int WarehouseId { get; set; }
    public DateOnly From { get; set; }
    public DateOnly To { get; set; }
}

public class GetStaffScheduleHandler : IRequestHandler<GetStaffScheduleQuery, List<StaffScheduleDto>>
{
    private readonly IStaffShiftRepository _repo;

    public GetStaffScheduleHandler(IStaffShiftRepository repo) => _repo = repo;

    public Task<List<StaffScheduleDto>> Handle(GetStaffScheduleQuery q, CancellationToken ct)
        => _repo.GetStaffScheduleAsync(q.WarehouseId, q.CallerId, q.From, q.To, ct);
}
