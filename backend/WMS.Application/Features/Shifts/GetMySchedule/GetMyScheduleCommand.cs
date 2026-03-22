using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Shifts.GetMySchedule;

public class GetMyScheduleCommand : IRequest<StaffScheduleDto?>
{
    public int CallerId { get; set; }
    public int WarehouseId { get; set; }
    public DateOnly From { get; set; }
    public DateOnly To { get; set; }
}
