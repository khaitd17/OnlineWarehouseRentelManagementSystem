using Microsoft.EntityFrameworkCore;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Repositories;

public class TaskRepository : ITaskRepository
{
    private readonly ApplicationDbContext _db;

    public TaskRepository(ApplicationDbContext db) => _db = db;

    public async Task<TaskListResult> GetTasksAsync(int warehouseId, int callerId, DateTime? weekStart, CancellationToken ct = default)
    {
        var caller = await _db.WarehouseMemberships
            .Where(m => m.UserId == callerId && m.WarehouseId == warehouseId && m.IsActive)
            .Include(m => m.Zones)
            .FirstOrDefaultAsync(ct);

        var q = _db.WarehouseTasks
            .Where(t => t.WarehouseId == warehouseId)
            .Include(t => t.TaskType)
            .Include(t => t.Zones)
            .Include(t => t.Assignments).ThenInclude(a => a.Membership).ThenInclude(m => m!.User)
            .AsQueryable();

        if (caller != null && !caller.IsAllZone)
        {
            var callerZoneIds = caller.Zones.Select(z => z.Id).ToList();
            q = q.Where(t => t.IsAllZone || t.Zones.Any(z => callerZoneIds.Contains(z.Id)));
        }

        if (weekStart.HasValue)
        {
            var weekEnd = weekStart.Value.AddDays(7);
            q = q.Where(t => t.ScheduledAt == null ||
                (t.ScheduledAt >= weekStart.Value && t.ScheduledAt < weekEnd));
        }

        var tasks = await q.OrderBy(t => t.ScheduledAt).ToListAsync(ct);
        var dtos = tasks.Select(MapToDto).ToList();

        return new TaskListResult
        {
            Scheduled   = dtos.Where(t => t.ScheduledAt.HasValue).ToList(),
            Unscheduled = dtos.Where(t => !t.ScheduledAt.HasValue).ToList(),
        };
    }

    public async Task<List<TaskTypeDto>> GetTaskTypesAsync(CancellationToken ct = default)
        => await _db.TaskTypes
            .Select(t => new TaskTypeDto
            {
                Id          = t.Id,
                Code        = t.Code,
                Name        = t.Name,
                Description = t.Description,
                IsAllSkill  = t.IsAllSkill,
            })
            .ToListAsync(ct);

    public async Task<int> CreateTaskAsync(CreateTaskDto dto, CancellationToken ct = default)
    {
        var task = new WarehouseTask
        {
            WarehouseId = dto.WarehouseId,
            TaskTypeId  = dto.TaskTypeId,
            IsAllZone   = dto.IsAllZone,
            Note        = dto.Note,
            ScheduledAt = dto.ScheduledAt,
            Status      = "Pending",
            CreatedAt   = DateTime.UtcNow,
        };

        if (!dto.IsAllZone && dto.ZoneIds.Any())
        {
            var zones = await _db.Zones
                .Where(z => dto.ZoneIds.Contains(z.Id) && z.WarehouseId == dto.WarehouseId)
                .ToListAsync(ct);
            foreach (var z in zones) task.Zones.Add(z);
        }

        _db.WarehouseTasks.Add(task);
        await _db.SaveChangesAsync(ct);
        return task.Id;
    }

    public async Task<int?> GetTaskWarehouseIdAsync(int taskId, CancellationToken ct = default)
        => await _db.WarehouseTasks
            .Where(t => t.Id == taskId)
            .Select(t => (int?)t.WarehouseId)
            .FirstOrDefaultAsync(ct);

    public async Task ScheduleAsync(int taskId, DateTime scheduledAt, CancellationToken ct = default)
    {
        var task = await _db.WarehouseTasks.FindAsync(new object[] { taskId }, ct)
            ?? throw new KeyNotFoundException($"Task {taskId} không tồn tại.");
        task.ScheduledAt = scheduledAt;
        await _db.SaveChangesAsync(ct);
    }

    public async Task UnscheduleAsync(int taskId, CancellationToken ct = default)
    {
        var task = await _db.WarehouseTasks.FindAsync(new object[] { taskId }, ct)
            ?? throw new KeyNotFoundException($"Task {taskId} không tồn tại.");
        task.ScheduledAt = null;
        await _db.SaveChangesAsync(ct);
    }

    public async Task AssignStaffAsync(int taskId, List<int> membershipIds, CancellationToken ct = default)
    {
        var task = await _db.WarehouseTasks
            .Include(t => t.Assignments)
            .FirstOrDefaultAsync(t => t.Id == taskId, ct)
            ?? throw new KeyNotFoundException($"Task {taskId} không tồn tại.");

        _db.TaskAssignments.RemoveRange(task.Assignments);
        foreach (var id in membershipIds)
        {
            _db.TaskAssignments.Add(new TaskAssignment
            {
                TaskId       = taskId,
                MembershipId = id,
                AssignedAt   = DateTime.UtcNow,
                Status       = "Assigned",
            });
        }
        await _db.SaveChangesAsync(ct);
    }

    public async Task<List<EligibleStaffDto>> GetEligibleStaffAsync(int taskId, int? callerId = null, CancellationToken ct = default)
    {
        var task = await _db.WarehouseTasks
            .Include(t => t.TaskType)
            .FirstOrDefaultAsync(t => t.Id == taskId, ct)
            ?? throw new KeyNotFoundException($"Task {taskId} không tồn tại.");

        var q = _db.WarehouseMemberships
            .Where(m => m.WarehouseId == task.WarehouseId && m.IsActive && m.Role.Code == "STAFF")
            .Include(m => m.User)
            .Include(m => m.Skills)
            .Include(m => m.Zones)
            .Include(m => m.Role)
            .AsQueryable();

        if (!task.TaskType.IsAllSkill && task.TaskType.SkillId.HasValue)
        {
            var requiredSkillId = task.TaskType.SkillId.Value;
            q = q.Where(m => m.IsAllSkill || m.Skills.Any(s => s.Id == requiredSkillId));
        }

        if (callerId.HasValue)
        {
            var caller = await _db.WarehouseMemberships
                .Where(m => m.UserId == callerId.Value && m.WarehouseId == task.WarehouseId && m.IsActive)
                .Include(m => m.Role)
                .Include(m => m.Skills)
                .Include(m => m.Zones)
                .FirstOrDefaultAsync(ct);

            if (caller != null && caller.Role.Code == "MANAGER")
            {
                var callerSkillIds = caller.Skills.Select(s => s.Id).ToList();
                var callerZoneIds  = caller.Zones.Select(z => z.Id).ToList();
                bool allSkill = caller.IsAllSkill;
                bool allZone  = caller.IsAllZone;

                q = q.Where(m =>
                    (allSkill && allZone) ||
                    (allSkill  && (m.IsAllZone  || m.Zones.Any(z  => callerZoneIds.Contains(z.Id))))  ||
                    (allZone   && (m.IsAllSkill || m.Skills.Any(s => callerSkillIds.Contains(s.Id)))) ||
                    (!allSkill && !allZone && (
                        m.Skills.Any(s => callerSkillIds.Contains(s.Id)) ||
                        m.Zones.Any(z  => callerZoneIds.Contains(z.Id))
                    ))
                );
            }
        }

        return await q.Select(m => new EligibleStaffDto
        {
            MembershipId = m.Id,
            FullName     = m.User!.FullName,
            Email        = m.User.Email,
            RoleCode     = m.Role.Code,
            Skills       = m.Skills.Select(s => s.Name).ToList(),
        }).ToListAsync(ct);
    }

    private static TaskDto MapToDto(WarehouseTask t) => new()
    {
        Id                 = t.Id,
        WarehouseId        = t.WarehouseId,
        TaskTypeId         = t.TaskTypeId,
        TaskTypeCode       = t.TaskType.Code,
        TaskTypeName       = t.TaskType.Name,
        TaskTypeIsAllSkill = t.TaskType.IsAllSkill,
        Status             = t.Status,
        ScheduledAt        = t.ScheduledAt,
        Note               = t.Note,
        IsAllZone          = t.IsAllZone,
        CreatedAt          = t.CreatedAt,
        Zones = t.Zones.Select(z => new ZoneItemDto { Id = z.Id, Code = z.Code, Name = z.Name }).ToList(),
        Assignments = t.Assignments.Select(a => new AssignmentDto
        {
            AssignmentId = a.Id,
            MembershipId = a.MembershipId,
            UserFullName = a.Membership?.User?.FullName ?? "",
            UserEmail    = a.Membership?.User?.Email    ?? "",
            Status       = a.Status,
        }).ToList(),
    };
}
