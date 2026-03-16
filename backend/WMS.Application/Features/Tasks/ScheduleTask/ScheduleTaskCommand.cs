using MediatR;

namespace WMS.Application.Features.Tasks.ScheduleTask;

public class ScheduleTaskCommand : IRequest<Unit>
{
    public int TaskId { get; set; }
    public DateTime ScheduledAt { get; set; }
}

public class UnscheduleTaskCommand : IRequest<Unit>
{
    public int TaskId { get; set; }
}
