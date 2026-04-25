using MediatR;

namespace WMS.Application.Features.Shifts.CreateWarehouseShift;

public class CreateWarehouseShiftCommand : IRequest<int>
{
    public int    WarehouseId { get; set; }
    public string Name       { get; set; } = null!;
    public string StartTime  { get; set; } = null!;
    public string EndTime    { get; set; } = null!;
}
