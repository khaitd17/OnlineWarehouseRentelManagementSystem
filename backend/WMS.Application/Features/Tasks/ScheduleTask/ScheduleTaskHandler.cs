using MediatR;
using WMS.Application.Interfaces;

namespace WMS.Application.Features.Tasks.ScheduleTask;

public class ScheduleTaskHandler : IRequestHandler<ScheduleTaskCommand, Unit>
{
    private readonly ITaskRepository _repo;

    public ScheduleTaskHandler(ITaskRepository repo) => _repo = repo;

    public async Task<Unit> Handle(ScheduleTaskCommand cmd, CancellationToken ct)
    {
        await _repo.ScheduleAsync(cmd.TaskId, cmd.ScheduledAt, ct);
        return Unit.Value;
    }
}
