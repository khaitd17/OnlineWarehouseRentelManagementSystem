using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Tasks.CreateTask;

// Chỉ các loại task nội bộ mới được phép tạo thủ công (INBOUND/OUTBOUND/AUDIT tự động qua workflow)
public class CreateTaskHandler : IRequestHandler<CreateTaskCommand, int>
{
    private static readonly HashSet<string> ManualAllowedCodes =
        new(StringComparer.OrdinalIgnoreCase) { "EQUIP_MAINT", "GENERAL_CLEAN", "ZONE_INSPECT", "OTHER" };

    private readonly ITaskRepository _taskRepo;
    private readonly IStaffMembershipRepository _membershipRepo;

    public CreateTaskHandler(ITaskRepository taskRepo, IStaffMembershipRepository membershipRepo)
    {
        _taskRepo       = taskRepo;
        _membershipRepo = membershipRepo;
    }

    public async Task<int> Handle(CreateTaskCommand cmd, CancellationToken ct)
    {
        // Kiểm tra quyền: chỉ MANAGER hoặc OPERATOR mới được tạo task
        var caller = await _membershipRepo.GetCallerMembershipAsync(cmd.CallerId, cmd.WarehouseId, ct)
            ?? throw new UnauthorizedAccessException("Bạn không có quyền trong kho này.");

        if (!new[] { "MANAGER", "OPERATOR" }.Contains(caller.RoleCode))
            throw new UnauthorizedAccessException("Chỉ Manager/Operator mới có quyền tạo task.");

        // Kiểm tra loại task: chỉ cho phép tạo thủ công task nội bộ đơn giản
        var taskType = await _taskRepo.GetTaskTypeByIdAsync(cmd.TaskTypeId, ct)
            ?? throw new KeyNotFoundException($"Loại task không tồn tại (id={cmd.TaskTypeId}).");

        if (!ManualAllowedCodes.Contains(taskType.Code))
            throw new InvalidOperationException(
                $"Loại task '{taskType.Name}' được tạo tự động từ quy trình nghiệp vụ, không thể tạo thủ công.");

        var dto = new CreateTaskDto
        {
            WarehouseId = cmd.WarehouseId,
            TaskTypeId  = cmd.TaskTypeId,
            Note        = cmd.Note,
            ScheduledAt = cmd.ScheduledAt,
        };

        return await _taskRepo.CreateTaskAsync(dto, ct);
    }
}
