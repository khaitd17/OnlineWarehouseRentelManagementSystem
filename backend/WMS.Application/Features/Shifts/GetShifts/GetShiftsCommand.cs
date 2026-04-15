using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Shifts.GetShifts;

public class GetShiftsCommand : IRequest<List<StaffShiftDto>>
{
    public int WarehouseId { get; set; }
    public DateOnly From { get; set; }
    public DateOnly To { get; set; }
    public int CallerId { get; set; }
}
