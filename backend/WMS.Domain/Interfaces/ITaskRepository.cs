namespace WMS.Domain.Interfaces;

public interface ITaskRepository
{
    Task<List<TaskDto>> GetTasksAsync(int warehouseId, DateTime startDate, DateTime endDate, CancellationToken ct = default);
    Task<List<TaskTypeDto>> GetTaskTypesAsync(CancellationToken ct = default);
    Task<int> CreateTaskAsync(CreateTaskDto dto, CancellationToken ct = default);
    Task<int?> GetTaskWarehouseIdAsync(int taskId, CancellationToken ct = default);

    Task<int> CreateWorkflowTaskAsync(string refType, int refId, int warehouseId, DateTime? scheduledAt = null, CancellationToken ct = default);
    Task CompleteUnitTaskAsync(string refType, int refId, string unitTaskTypeCode, int performedById, CancellationToken ct = default);
}

public class TaskListResult
{
    public List<TaskDto> Tasks { get; set; } = new();
}

public class TaskDto
{
    public int Id { get; set; }
    public int WarehouseId { get; set; }
    public int TaskTypeId { get; set; }
    public string TaskTypeCode { get; set; } = null!;
    public string TaskTypeName { get; set; } = null!;
    public string Status { get; set; } = null!;
    public string? RefType { get; set; }
    public int? RefId { get; set; }
    public DateTime? ScheduledAt { get; set; }
    public string? Note { get; set; }
    public bool IsAllZone { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<ZoneItemDto> Zones { get; set; } = new();
    public List<UnitTaskDto> UnitTasks { get; set; } = new();
}

public class ZoneItemDto
{
    public int Id { get; set; }
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
}

public class UnitTaskDto
{
    public int Id { get; set; }
    public string? UnitTaskTypeCode { get; set; }
    public int Order { get; set; }
    public string Description { get; set; } = null!;
    public string Status { get; set; } = null!;
    public DateTime? CompletedAt { get; set; }
    public int? CompletedById { get; set; }
    public string? CompletedByName { get; set; }
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
