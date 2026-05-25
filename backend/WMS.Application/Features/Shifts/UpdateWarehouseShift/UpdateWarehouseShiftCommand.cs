using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Shifts.UpdateWarehouseShift;

public class UpdateWarehouseShiftCommand : IRequest<Unit>
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string StartTime { get; set; } = null!;
    public string EndTime { get; set; } = null!;
}
