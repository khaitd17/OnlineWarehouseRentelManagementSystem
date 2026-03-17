using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Shifts.GetShifts;

public class GetShiftsQuery : IRequest<List<StaffShiftDto>>
{
    public int WarehouseId { get; set; }
    public DateOnly From { get; set; }
    public DateOnly To { get; set; }
}

public class GetShiftsHandler : IRequestHandler<GetShiftsQuery, List<StaffShiftDto>>
{
    private readonly IStaffShiftRepository _repo;

    public GetShiftsHandler(IStaffShiftRepository repo)
    {
        _repo = repo;
    }

    public Task<List<StaffShiftDto>> Handle(GetShiftsQuery request, CancellationToken cancellationToken)
        => _repo.GetShiftsAsync(request.WarehouseId, request.From, request.To, cancellationToken);
}
