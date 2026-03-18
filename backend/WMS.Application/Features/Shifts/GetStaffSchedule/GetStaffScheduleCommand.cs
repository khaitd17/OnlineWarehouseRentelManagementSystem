using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Shifts.GetStaffSchedule;

public class GetStaffScheduleCommand : IRequest<List<StaffScheduleDto>>
{
    public int CallerId { get; set; }
    public int WarehouseId { get; set; }
    public DateOnly From { get; set; }
    public DateOnly To { get; set; }
}
