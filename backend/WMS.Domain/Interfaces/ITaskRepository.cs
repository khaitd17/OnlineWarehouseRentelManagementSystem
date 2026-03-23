namespace WMS.Domain.Interfaces;

public interface ITaskRepository
{
    Task<TaskListResult> GetTasksAsync(int warehouseId, int callerId, DateTime? weekStart, CancellationToken ct = default);
    Task<List<TaskTypeDto>> GetTaskTypesAsync(CancellationToken ct = default);
    Task<int> CreateTaskAsync(CreateTaskDto dto, CancellationToken ct = default);
    Task<int?> GetTaskWarehouseIdAsync(int taskId, CancellationToken ct = default);
    Task ScheduleAsync(int taskId, DateTime scheduledAt, CancellationToken ct = default);
    Task UnscheduleAsync(int taskId, CancellationToken ct = default);
    Task AssignStaffAsync(int taskId, List<int> membershipIds, CancellationToken ct = default);
    Task<List<EligibleStaffDto>> GetEligibleStaffAsync(int taskId, int? callerId = null, CancellationToken ct = default);
}

public class TaskListResult
{
    public List<TaskDto> Scheduled { get; set; } = new();
    public List<TaskDto> Unscheduled { get; set; } = new();
}

public class TaskDto
{
    public int Id { get; set; }
    public int WarehouseId { get; set; }
    public int TaskTypeId { get; set; }
    public string TaskTypeCode { get; set; } = null!;
    public string TaskTypeName { get; set; } = null!;
    public bool TaskTypeIsAllSkill { get; set; }
    public string Status { get; set; } = null!;
    public DateTime? ScheduledAt { get; set; }
    public string? Note { get; set; }
    public bool IsAllZone { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<ZoneItemDto> Zones { get; set; } = new();
    public List<AssignmentDto> Assignments { get; set; } = new();
}

public class ZoneItemDto
{
    public int Id { get; set; }
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
}

public class AssignmentDto
{
    public int AssignmentId { get; set; }
    public int MembershipId { get; set; }
    public string UserFullName { get; set; } = null!;
    public string UserEmail { get; set; } = null!;
    public string Status { get; set; } = null!;
}

public class CreateTaskDto
{
    public int WarehouseId { get; set; }
    public int TaskTypeId { get; set; }
    public bool IsAllZone { get; set; }
    public List<int> ZoneIds { get; set; } = new();
    public string? Note { get; set; }
    public DateTime? ScheduledAt { get; set; }
}

public class TaskTypeDto
{
    public int Id { get; set; }
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public bool IsAllSkill { get; set; }
}

public class EligibleStaffDto
{
    public int MembershipId { get; set; }
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string RoleCode { get; set; } = null!;
    public List<string> Skills { get; set; } = new();
}
