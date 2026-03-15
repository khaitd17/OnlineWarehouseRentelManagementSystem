using MediatR;
using WMS.Application.Interfaces;

namespace WMS.Application.Features.Tasks.ScheduleTask;

public class UnscheduleTaskHandler : IRequestHandler<UnscheduleTaskCommand, Unit>
{
    private readonly ITaskRepository _repo;

    public UnscheduleTaskHandler(ITaskRepository repo) => _repo = repo;

    public async Task<Unit> Handle(UnscheduleTaskCommand cmd, CancellationToken ct)
    {
        await _repo.UnscheduleAsync(cmd.TaskId, ct);
        return Unit.Value;
    }
}
