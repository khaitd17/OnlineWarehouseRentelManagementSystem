using WMS.Application.Features.Tasks.GetTasks;
using WMS.Application.Features.Tasks.CreateTask;

namespace WMS.Application.Interfaces;

public interface ITaskRepository
{
    Task<TaskListResult> GetTasksAsync(GetTasksQuery query, CancellationToken ct = default);
    Task<List<TaskTypeDto>> GetTaskTypesAsync(CancellationToken ct = default);
    Task<int> CreateTaskAsync(CreateTaskDto dto, CancellationToken ct = default);
    Task ScheduleAsync(int taskId, DateTime scheduledAt, CancellationToken ct = default);
    Task UnscheduleAsync(int taskId, CancellationToken ct = default);
    Task AssignStaffAsync(int taskId, List<int> membershipIds, CancellationToken ct = default);
    Task<List<EligibleStaffDto>> GetEligibleStaffAsync(int taskId, CancellationToken ct = default);
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
