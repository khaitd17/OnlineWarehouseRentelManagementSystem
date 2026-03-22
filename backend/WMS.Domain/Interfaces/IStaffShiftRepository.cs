namespace WMS.Domain.Interfaces;

public interface IStaffShiftRepository
{
    Task<List<StaffShiftDto>> GetShiftsAsync(int warehouseId, DateOnly from, DateOnly to, CancellationToken ct = default);
    Task SaveShiftsAsync(List<UpsertShiftDto> shifts, CancellationToken ct = default);
    Task<List<StaffScheduleDto>> GetStaffScheduleAsync(int warehouseId, int callerId, DateOnly from, DateOnly to, CancellationToken ct = default);
    Task<StaffScheduleDto?> GetMyScheduleAsync(int userId, int warehouseId, DateOnly from, DateOnly to, CancellationToken ct = default);
}

public class StaffScheduleDto
{
    public int MembershipId { get; set; }
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Phone { get; set; }
    public string RoleCode { get; set; } = null!;
    public List<string> Skills { get; set; } = new();
    public List<string> Zones { get; set; } = new();
    public Dictionary<string, ShiftSlotDto?> Shifts { get; set; } = new();
}

public class ShiftSlotDto
{
    public string? TimeIn1 { get; set; }
    public string? TimeOut1 { get; set; }
    public string? TimeIn2 { get; set; }
    public string? TimeOut2 { get; set; }
    public string? ShiftType { get; set; }
    public List<TaskSlotDto> Tasks { get; set; } = new();
}

public class TaskSlotDto
{
    public int TaskId { get; set; }
    public string TaskTypeName { get; set; } = null!;
    public string TaskTypeCode { get; set; } = null!;
    public string Status { get; set; } = null!;
    public string? Note { get; set; }
    public string? ScheduledAt { get; set; }
}

public class StaffShiftDto
{
    public int MembershipId { get; set; }
    public string ShiftDate { get; set; } = null!;
    public string? TimeIn1 { get; set; }
    public string? TimeOut1 { get; set; }
    public string? TimeIn2 { get; set; }
    public string? TimeOut2 { get; set; }
    public string? ShiftType { get; set; }
}

public class UpsertShiftDto : StaffShiftDto { }
