using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Tasks.ScheduleTask;

public class ScheduleTaskHandler : IRequestHandler<ScheduleTaskCommand, Unit>
{
    private readonly ITaskRepository _repo;
    private readonly IStaffMembershipRepository _membershipRepo;

    public ScheduleTaskHandler(ITaskRepository repo, IStaffMembershipRepository membershipRepo)
    {
        _repo = repo;
        _membershipRepo = membershipRepo;
    }

    public async Task<Unit> Handle(ScheduleTaskCommand cmd, CancellationToken ct)
    {
        var warehouseId = await _repo.GetTaskWarehouseIdAsync(cmd.TaskId, ct)
            ?? throw new KeyNotFoundException($"Task {cmd.TaskId} không tồn tại.");

        var caller = await _membershipRepo.GetCallerMembershipAsync(cmd.CallerId, warehouseId, ct)
            ?? throw new UnauthorizedAccessException("Bạn không có quyền trong kho này.");

        if (caller.RoleCode != "OPERATOR" && caller.RoleCode != "MANAGER")
            throw new UnauthorizedAccessException("Chỉ OPERATOR hoặc MANAGER mới được lên lịch task.");

        await _repo.ScheduleAsync(cmd.TaskId, cmd.ScheduledAt, ct);
        return Unit.Value;
    }
}

public class UnscheduleTaskHandler : IRequestHandler<UnscheduleTaskCommand, Unit>
{
    private readonly ITaskRepository _repo;
    private readonly IStaffMembershipRepository _membershipRepo;

    public UnscheduleTaskHandler(ITaskRepository repo, IStaffMembershipRepository membershipRepo)
    {
        _repo = repo;
        _membershipRepo = membershipRepo;
    }

    public async Task<Unit> Handle(UnscheduleTaskCommand cmd, CancellationToken ct)
    {
        var warehouseId = await _repo.GetTaskWarehouseIdAsync(cmd.TaskId, ct)
            ?? throw new KeyNotFoundException($"Task {cmd.TaskId} không tồn tại.");

        var caller = await _membershipRepo.GetCallerMembershipAsync(cmd.CallerId, warehouseId, ct)
            ?? throw new UnauthorizedAccessException("Bạn không có quyền trong kho này.");

        if (caller.RoleCode != "OPERATOR" && caller.RoleCode != "MANAGER")
            throw new UnauthorizedAccessException("Chỉ OPERATOR hoặc MANAGER mới được bỏ lịch task.");

        await _repo.UnscheduleAsync(cmd.TaskId, ct);
        return Unit.Value;
    }
}
