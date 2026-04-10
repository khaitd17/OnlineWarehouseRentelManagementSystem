using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Shifts.GetWarehouseShifts;

public class GetWarehouseShiftsQuery : IRequest<List<WarehouseShiftLookupDto>>
{
    public int WarehouseId { get; set; }
}
