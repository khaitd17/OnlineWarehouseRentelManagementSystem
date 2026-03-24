using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Tasks.CreateTask;

public class CreateTaskHandler : IRequestHandler<CreateTaskCommand, int>
{
    private readonly ITaskRepository _repo;
    private readonly IStaffMembershipRepository _membershipRepo;
    private readonly IWarehouseRepository _warehouseRepo;

    public CreateTaskHandler(ITaskRepository repo, IStaffMembershipRepository membershipRepo, IWarehouseRepository warehouseRepo)
    {
        _repo           = repo;
        _membershipRepo = membershipRepo;
        _warehouseRepo  = warehouseRepo;
    }

    public async Task<int> Handle(CreateTaskCommand cmd, CancellationToken ct)
    {
        var caller = await _membershipRepo.GetCallerMembershipAsync(cmd.CallerId, cmd.WarehouseId, ct)
            ?? throw new UnauthorizedAccessException("Bạn không có quyền trong kho này.");

        var allowedRoles = new[] { "MANAGER", "OPERATOR" };
        if (!allowedRoles.Contains(caller.RoleCode))
            throw new UnauthorizedAccessException("Chỉ Manager/Operator mới được tạo task.");

        var warehouse = await _warehouseRepo.GetByIdAsync(cmd.WarehouseId, ct)
            ?? throw new KeyNotFoundException("Kho không tồn tại.");

        // Zone logic thuộc về WarehouseTask, không còn phụ thuộc vào CallerMembership zone scope
        bool effectiveAllZone = !warehouse.HasZone || cmd.IsAllZone;
        var zoneIds = effectiveAllZone ? new List<int>() : cmd.ZoneIds;

        return await _repo.CreateTaskAsync(new CreateTaskDto
        {
            WarehouseId = cmd.WarehouseId,
            TaskTypeId  = cmd.TaskTypeId,
            IsAllZone   = effectiveAllZone,
            ZoneIds     = zoneIds,
            Note        = cmd.Note,
            ScheduledAt = cmd.ScheduledAt,
        }, ct);
    }
}
