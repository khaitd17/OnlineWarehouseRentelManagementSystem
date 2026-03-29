using Microsoft.EntityFrameworkCore;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Repositories;

public class TaskRepository : ITaskRepository
{
    private readonly ApplicationDbContext _db;

    public TaskRepository(ApplicationDbContext db) => _db = db;

    // ─── Get tasks by date range ───────────────────────────────────────────────
    public async Task<List<TaskDto>> GetTasksAsync(
        int warehouseId, DateTime startDate, DateTime endDate, CancellationToken ct = default)
    {
        var tasks = await _db.WarehouseTasks
            .Where(t => t.WarehouseId == warehouseId
                     && t.ScheduledAt.HasValue
                     && t.ScheduledAt.Value >= startDate
                     && t.ScheduledAt.Value <= endDate)
            .Include(t => t.TaskType)
            .Include(t => t.Zones)
            .Include(t => t.UnitTasks)
                .ThenInclude(u => u.CompletedByUser)
            .OrderBy(t => t.ScheduledAt)
            .ToListAsync(ct);

        return tasks.Select(MapToDto).ToList();
    }

    // ─── Get task types ────────────────────────────────────────────────────────
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

    // ─── Create task + auto-create UnitTasks ───────────────────────────────────
    public async Task<int> CreateTaskAsync(CreateTaskDto dto, CancellationToken ct = default)
    {
        var task = new WarehouseTask
        {
            WarehouseId = dto.WarehouseId,
            TaskTypeId  = dto.TaskTypeId,
            IsAllZone   = dto.IsAllZone,
            Note        = dto.Note,
            ScheduledAt = dto.ScheduledAt,
            Status      = nameof(WarehouseTaskStatus.Pending),
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

        // Auto-create UnitTasks based on TaskType.Code
        var taskType = await _db.TaskTypes.FindAsync(new object[] { dto.TaskTypeId }, ct);
        if (taskType != null)
        {
            var unitTypeCode = taskType.Code?.ToUpperInvariant();
            var steps = GetUnitTaskSteps(unitTypeCode);
            foreach (var (code, desc, order) in steps)
            {
                _db.UnitTasks.Add(new UnitTask
                {
                    WarehouseTaskId  = task.Id,
                    UnitTaskTypeCode = code,
                    Description      = desc,
                    Order            = order,
                    Status           = nameof(UnitTaskStatus.Pending),
                    CreatedAt        = DateTime.UtcNow,
                });
            }
            await _db.SaveChangesAsync(ct);
        }

        return task.Id;
    }

    // ─── Get warehouse id for a task ──────────────────────────────────────────
    public async Task<int?> GetTaskWarehouseIdAsync(int taskId, CancellationToken ct = default)
        => await _db.WarehouseTasks
            .Where(t => t.Id == taskId)
            .Select(t => (int?)t.WarehouseId)
            .FirstOrDefaultAsync(ct);

    // ─── Create workflow task from a business event ────────────────────────────
    public async Task<int> CreateWorkflowTaskAsync(
        string refType, int refId, int warehouseId, DateTime? scheduledAt = null, CancellationToken ct = default)
    {
        // Map refType → TaskType
        var typeCode = refType.ToUpperInvariant() switch
        {
            "INBOUND"  => "INBOUND",
            "OUTBOUND" => "OUTBOUND",
            "AUDIT"    => "AUDIT",
            _          => throw new ArgumentException($"Unknown refType: {refType}")
        };

        var taskType = await _db.TaskTypes
            .FirstOrDefaultAsync(t => t.Code == typeCode, ct)
            ?? throw new InvalidOperationException($"TaskType '{typeCode}' không tồn tại trong DB.");

        var task = new WarehouseTask
        {
            WarehouseId = warehouseId,
            TaskTypeId  = taskType.Id,
            RefType     = refType.ToUpperInvariant(),
            RefId       = refId,
            IsAllZone   = true,
            ScheduledAt = scheduledAt ?? DateTime.UtcNow,
            Status      = nameof(WarehouseTaskStatus.Pending),
            CreatedAt   = DateTime.UtcNow,
        };

        _db.WarehouseTasks.Add(task);
        await _db.SaveChangesAsync(ct);

        // Auto-create all UnitTasks for this workflow type
        var steps = GetUnitTaskSteps(typeCode);
        foreach (var (code, desc, order) in steps)
        {
            _db.UnitTasks.Add(new UnitTask
            {
                WarehouseTaskId  = task.Id,
                UnitTaskTypeCode = code,
                Description      = desc,
                Order            = order,
                Status           = nameof(UnitTaskStatus.Pending),
                CreatedAt        = DateTime.UtcNow,
            });
        }
        await _db.SaveChangesAsync(ct);

        return task.Id;
    }

    // ─── Complete a UnitTask from a business screen ────────────────────────────
    public async Task CompleteUnitTaskAsync(
        string refType, int refId, string unitTaskTypeCode, int performedById, CancellationToken ct = default)
    {
        var task = await _db.WarehouseTasks
            .Include(t => t.UnitTasks)
            .FirstOrDefaultAsync(
                t => t.RefType == refType.ToUpperInvariant() && t.RefId == refId, ct)
            ?? throw new KeyNotFoundException(
                $"Không tìm thấy WarehouseTask cho refType='{refType}', refId={refId}.");

        var unitTask = task.UnitTasks
            .FirstOrDefault(u => u.UnitTaskTypeCode == unitTaskTypeCode)
            ?? throw new KeyNotFoundException(
                $"Không tìm thấy UnitTask '{unitTaskTypeCode}' trong task #{task.Id}.");

        unitTask.Status      = nameof(UnitTaskStatus.Done);
        unitTask.CompletedAt = DateTime.UtcNow;
        unitTask.CompletedBy = performedById;

        // Cập nhật status của WarehouseTask = bước vừa hoàn thành
        // Nếu toàn bộ UnitTask đã Done → đánh dấu task tổng là Done
        var allDone = task.UnitTasks.All(u =>
            u.UnitTaskTypeCode == unitTaskTypeCode
            || u.Status == nameof(UnitTaskStatus.Done));

        task.Status = allDone
            ? nameof(WarehouseTaskStatus.Done)
            : unitTaskTypeCode;

        await _db.SaveChangesAsync(ct);
    }

    // ─── Helper: unit task step definitions ───────────────────────────────────
    private static List<(string Code, string Desc, int Order)> GetUnitTaskSteps(string? typeCode)
        => typeCode switch
        {
            "INBOUND" =>
            [
                (nameof(UnitTaskTypeCode.INBOUND_APPROVE),  "Duyệt đơn nhập kho",            1),
                (nameof(UnitTaskTypeCode.INBOUND_RECEIVE),  "Tiếp nhận & xác nhận nhập kho", 2),
                (nameof(UnitTaskTypeCode.INBOUND_PUTAWAY),  "Đặt hàng vào vị trí",           3),
            ],
            "OUTBOUND" =>
            [
                (nameof(UnitTaskTypeCode.OUTBOUND_APPROVE),  "Duyệt đơn xuất kho",             1),
                (nameof(UnitTaskTypeCode.OUTBOUND_PICK),     "Lấy hàng từ vị trí (Picking)",   2),
                (nameof(UnitTaskTypeCode.OUTBOUND_DISPATCH), "Xác nhận xuất kho",               3),
            ],
            "AUDIT" =>
            [
                (nameof(UnitTaskTypeCode.AUDIT_OPEN),  "Mở phiên kiểm kê",       1),
                (nameof(UnitTaskTypeCode.AUDIT_COUNT), "Nhập kết quả kiểm đếm",  2),
                (nameof(UnitTaskTypeCode.AUDIT_CLOSE), "Đóng phiên kiểm kê",     3),
            ],
            _ => []
        };

    // ─── Mapping ───────────────────────────────────────────────────────────────
    private static TaskDto MapToDto(WarehouseTask t) => new()
    {
        Id           = t.Id,
        WarehouseId  = t.WarehouseId,
        TaskTypeId   = t.TaskTypeId,
        TaskTypeCode = t.TaskType.Code,
        TaskTypeName = t.TaskType.Name,
        Status       = t.Status,
        RefType      = t.RefType,
        RefId        = t.RefId,
        ScheduledAt  = t.ScheduledAt,
        Note         = t.Note,
        IsAllZone    = t.IsAllZone,
        CreatedAt    = t.CreatedAt,
        Zones        = t.Zones.Select(z => new ZoneItemDto { Id = z.Id, Code = z.Code, Name = z.Name }).ToList(),
        UnitTasks    = t.UnitTasks.OrderBy(u => u.Order).Select(u => new UnitTaskDto
        {
            Id               = u.Id,
            UnitTaskTypeCode = u.UnitTaskTypeCode,
            Order            = u.Order,
            Description      = u.Description,
            Status           = u.Status,
            CompletedAt      = u.CompletedAt,
            CompletedById    = u.CompletedBy,
            CompletedByName  = u.CompletedByUser?.FullName,
        }).ToList(),
    };
}
