namespace WMS.Domain.Interfaces;

public interface IStaffShiftRepository
{
    Task<List<StaffShiftDto>> GetShiftsAsync(int warehouseId, DateOnly from, DateOnly to, CancellationToken ct = default);
    Task SaveShiftsAsync(List<UpsertShiftDto> shifts, CancellationToken ct = default);
    Task<List<StaffScheduleDto>> GetStaffScheduleAsync(int warehouseId, int callerId, DateOnly from, DateOnly to, CancellationToken ct = default);
    Task<StaffScheduleDto?> GetMyScheduleAsync(int userId, int warehouseId, DateOnly from, DateOnly to, CancellationToken ct = default);
    Task<List<WarehouseShiftLookupDto>> GetWarehouseShiftsAsync(int warehouseId, CancellationToken ct = default);
    Task<int> CreateWarehouseShiftAsync(int warehouseId, string name, string startTime, string endTime, CancellationToken ct = default);
    Task DeleteWarehouseShiftAsync(int id, CancellationToken ct = default);
    Task<GenerateScheduleSummary> GenerateScheduleAsync(int warehouseId, DateOnly from, DateOnly to, CancellationToken ct = default);

    // Lay shift theo ID de dung trong check-in / check-out
    Task<WMS.Domain.Entities.StaffShift?> GetByIdAsync(int staffShiftId, CancellationToken ct = default);

    // Ghi check-in (chi ghi 1 lan, handler kiem tra truoc)
    Task RecordCheckInAsync(int staffShiftId, DateTime capturedAt, string photoUrl, CancellationToken ct = default);

    // Ghi / ghi de check-out  
    Task RecordCheckOutAsync(int staffShiftId, DateTime capturedAt, string photoUrl, CancellationToken ct = default);

    // Cap nhat so gio tang ca cho 1 shift
    Task SetOvertimeAsync(int staffShiftId, decimal hours, CancellationToken ct = default);

    // Cap nhat tang ca hang loat: nhieu membership, 1 ngay, cung so gio
    Task BulkSetOvertimeAsync(int warehouseId, DateOnly date, List<int> membershipIds, decimal hours, CancellationToken ct = default);
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
    // ID cua StaffShift, frontend can de goi check-in/out
    public int? StaffShiftId { get; set; }

    public string? TimeIn1 { get; set; }
    public string? TimeOut1 { get; set; }
    public string? TimeIn2 { get; set; }
    public string? TimeOut2 { get; set; }
    public string? ShiftType { get; set; }
    public List<TaskSlotDto> Tasks { get; set; } = new();

    // So gio tang ca
    public decimal OvertimeHours { get; set; }

    // Du lieu diem danh thuc te
    public DateTime? CheckInAt { get; set; }
    public string? CheckInPhoto { get; set; }
    public DateTime? CheckOutAt { get; set; }
    public string? CheckOutPhoto { get; set; }

    // True neu check-out truoc gio tan ca
    public bool IsEarlyLeave { get; set; }
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
    // So gio tang ca
    public decimal OvertimeHours { get; set; }
}

public class UpsertShiftDto : StaffShiftDto { }

public class WarehouseShiftLookupDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string StartTime { get; set; } = null!;
    public string EndTime { get; set; } = null!;
    public int? WarehouseId { get; set; }
}

public class GenerateScheduleSummary
{
    public string Message { get; set; } = null!;
    public int Created { get; set; }
    public int Skipped { get; set; }
}
