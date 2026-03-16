using MediatR;

namespace WMS.Application.Features.Tasks.GetTasks;

public class GetTasksQuery : IRequest<TaskListResult>
{
    public int WarehouseId { get; set; }
    public int CallerId { get; set; }
    public DateTime? WeekStart { get; set; }
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
