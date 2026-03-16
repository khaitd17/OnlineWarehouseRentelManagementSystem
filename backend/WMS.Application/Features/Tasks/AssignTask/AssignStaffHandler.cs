using MediatR;
using WMS.Application.Interfaces;

namespace WMS.Application.Features.Tasks.AssignTask;

public class AssignStaffHandler : IRequestHandler<AssignStaffCommand, Unit>
{
    private readonly ITaskRepository _repo;

    public AssignStaffHandler(ITaskRepository repo) => _repo = repo;

    public async Task<Unit> Handle(AssignStaffCommand cmd, CancellationToken ct)
    {
        await _repo.AssignStaffAsync(cmd.TaskId, cmd.MembershipIds, ct);
        return Unit.Value;
    }
}
