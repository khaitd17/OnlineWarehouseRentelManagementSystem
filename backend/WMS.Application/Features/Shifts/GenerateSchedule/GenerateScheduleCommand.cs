using MediatR;

namespace WMS.Application.Features.Shifts.GenerateSchedule;

public class GenerateScheduleCommand : IRequest<GenerateScheduleResult>
{
    public int WarehouseId { get; set; }
    public DateOnly From { get; set; }
    public DateOnly To { get; set; }
}

public class GenerateScheduleResult
{
    public string Message { get; set; } = null!;
    public int Created { get; set; }
    public int Skipped { get; set; }
}
