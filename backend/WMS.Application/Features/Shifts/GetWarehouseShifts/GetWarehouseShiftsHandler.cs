using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Shifts.GetWarehouseShifts;

public class GetWarehouseShiftsHandler : IRequestHandler<GetWarehouseShiftsQuery, List<WarehouseShiftLookupDto>>
{
    private readonly IStaffShiftRepository _repo;

    public GetWarehouseShiftsHandler(IStaffShiftRepository repo) => _repo = repo;

    public Task<List<WarehouseShiftLookupDto>> Handle(GetWarehouseShiftsQuery request, CancellationToken ct)
        => _repo.GetWarehouseShiftsAsync(request.WarehouseId, ct);
}
