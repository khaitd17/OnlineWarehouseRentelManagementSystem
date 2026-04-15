using Microsoft.EntityFrameworkCore;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Repositories;

public class StaffShiftRepository : IStaffShiftRepository
{
    private readonly ApplicationDbContext _db;

    public StaffShiftRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<StaffShiftDto>> GetShiftsAsync(
        int warehouseId,
        DateOnly from,
        DateOnly to,
        CancellationToken ct = default)
    {
        return await _db.StaffShifts
            .Where(s => s.Membership.WarehouseId == warehouseId
                     && s.ShiftDate >= from
                     && s.ShiftDate <= to)
            .Select(s => new StaffShiftDto
            {
                MembershipId = s.MembershipId,
                ShiftDate    = s.ShiftDate.ToString("yyyy-MM-dd"),
                TimeIn1      = s.TimeIn1,
                TimeOut1     = s.TimeOut1,
                TimeIn2      = s.TimeIn2,
                TimeOut2     = s.TimeOut2,
                ShiftType    = s.ShiftType,
            })
            .ToListAsync(ct);
    }

    public async Task<List<StaffScheduleDto>> GetStaffScheduleAsync(
        int warehouseId,
        int callerId,
        DateOnly from,
        DateOnly to,
        CancellationToken ct = default)
    {
        var caller = await _db.WarehouseMemberships
            .Where(m => m.UserId == callerId && m.WarehouseId == warehouseId && m.IsActive)
            .Include(m => m.Role)
            .Include(m => m.Skills)
            .Include(m => m.Zones)
            .FirstOrDefaultAsync(ct);

        var q = _db.WarehouseMemberships
            .Where(m => m.WarehouseId == warehouseId && m.IsActive && m.Role.Code != "OWNER")
            .Include(m => m.User)
            .Include(m => m.Role)
            .Include(m => m.Skills)
            .Include(m => m.Zones)
            .AsQueryable();

        if (caller == null)
        {
            // no membership → return empty
            return new List<StaffScheduleDto>();
        }

        var callerRole = caller.Role.Code;

        if (callerRole == "MANAGER")
        {
            var callerSkillIds = caller.Skills.Select(s => s.Id).ToList();
            bool allSkill = caller.IsAllSkill;

            // Manager chỉ thấy STAFF trong phạm vi skill của mình
            q = q.Where(m =>
                m.Role.Code == "OPERATOR" || // operators visible to manager
                m.UserId == callerId      || // chính mình
                allSkill                  || // full skill access
                m.IsAllSkill              ||
                m.Skills.Any(s => callerSkillIds.Contains(s.Id))
            );
        }
        else if (callerRole == "STAFF")
        {
            // STAFF chỉ thấy chính mình
            q = q.Where(m => m.UserId == callerId);
        }
        // OPERATOR và OWNER thấy tất cả (q không filter thêm)

        var members = await q.OrderBy(m => m.User!.FullName).ToListAsync(ct);
        var memberIds = members.Select(m => m.Id).ToList();

        var shifts = await _db.StaffShifts
            .Where(s => memberIds.Contains(s.MembershipId) && s.ShiftDate >= from && s.ShiftDate <= to)
            .ToListAsync(ct);

        // Load tasks: task không còn zone, mọi nhân viên trong kho đều thấy task manual
        var memberZoneIds = new List<int>(); // giữ lại để không phá vỡ memberZoneMap query bên dưới

        var warehouseTasks = await _db.WarehouseTasks
            .Where(t => t.WarehouseId == warehouseId
                     && t.ScheduledAt.HasValue
                     && DateOnly.FromDateTime(t.ScheduledAt.Value) >= from
                     && DateOnly.FromDateTime(t.ScheduledAt.Value) <= to)
            .Include(t => t.TaskType)
            .ToListAsync(ct);

        // Map tasks to each member whose zones intersect
        var memberZoneMap = await _db.WarehouseMemberships
            .Where(m => memberIds.Contains(m.Id))
            .Select(m => new { m.Id, ZoneIds = m.Zones.Select(z => z.Id).ToList(), m.IsAllZone })
            .ToListAsync(ct);

        var taskMap = new Dictionary<(int, string), List<TaskSlotDto>>();
        foreach (var member in memberZoneMap)
        {
            foreach (var t in warehouseTasks)
            {
                var dateKey = DateOnly.FromDateTime(t.ScheduledAt!.Value).ToString("yyyy-MM-dd");
                var key = (member.Id, dateKey);
                if (!taskMap.ContainsKey(key)) taskMap[key] = new List<TaskSlotDto>();
                taskMap[key].Add(new TaskSlotDto
                {
                    TaskId       = t.Id,
                    TaskTypeName = t.TaskType.Name,
                    TaskTypeCode = t.TaskType.Code,
                    Status       = t.Status,
                    Note         = t.Note,
                    ScheduledAt  = t.ScheduledAt?.ToString("yyyy-MM-ddTHH:mm"),
                });
            }
        }

        var shiftMap = shifts
            .GroupBy(s => s.MembershipId)
            .ToDictionary(
                g => g.Key,
                g => g.ToDictionary(
                    s => s.ShiftDate.ToString("yyyy-MM-dd"),
                    s =>
                    {
                        var dateKey = s.ShiftDate.ToString("yyyy-MM-dd");
                        var tasks = taskMap.TryGetValue((s.MembershipId, dateKey), out var t) ? t : new List<TaskSlotDto>();

                        // Tinh IsEarlyLeave: so sanh checkout voi gio tan ca
                        bool isEarly = false;
                        if (s.CheckOutAt.HasValue && !string.IsNullOrEmpty(s.TimeOut1))
                        {
                            var shiftEnd = ComputeShiftEnd(s.ShiftDate, s.TimeIn1, s.TimeOut1, s.OvertimeHours);
                            isEarly = s.CheckOutAt.Value < shiftEnd;
                        }

                        return (ShiftSlotDto?)new ShiftSlotDto
                        {
                            StaffShiftId  = s.Id,
                            TimeIn1       = s.TimeIn1,
                            TimeOut1      = s.TimeOut1,
                            TimeIn2       = s.TimeIn2,
                            TimeOut2      = s.TimeOut2,
                            ShiftType     = s.ShiftType,
                            OvertimeHours = s.OvertimeHours,
                            Tasks         = tasks,
                            CheckInAt     = s.CheckInAt,
                            CheckInPhoto  = s.CheckInPhoto,
                            CheckOutAt    = s.CheckOutAt,
                            CheckOutPhoto = s.CheckOutPhoto,
                            IsEarlyLeave  = isEarly,
                        };
                    }));

        return members.Select(m => new StaffScheduleDto
        {
            MembershipId = m.Id,
            FullName     = m.User!.FullName ?? "",
            Email        = m.User.Email ?? "",
            Phone        = m.User.Phone,
            RoleCode     = m.Role.Code,
            Skills       = m.Skills.Select(s => s.Name).ToList(),
            Zones        = m.Zones.Select(z => z.Name).ToList(),
            Shifts       = shiftMap.TryGetValue(m.Id, out var s) ? s : new Dictionary<string, ShiftSlotDto?>(),
        }).ToList();
    }

    // ── GetMyScheduleAsync (personal schedule for one user) ───────────────────
    public async Task<StaffScheduleDto?> GetMyScheduleAsync(
        int userId,
        int warehouseId,
        DateOnly from,
        DateOnly to,
        CancellationToken ct = default)
    {
        var membership = await _db.WarehouseMemberships
            .Where(m => m.UserId == userId && m.WarehouseId == warehouseId && m.IsActive)
            .Include(m => m.User)
            .Include(m => m.Role)
            .Include(m => m.Skills)
            .Include(m => m.Zones)
            .FirstOrDefaultAsync(ct);

        if (membership == null) return null;

        var shifts = await _db.StaffShifts
            .Where(s => s.MembershipId == membership.Id && s.ShiftDate >= from && s.ShiftDate <= to)
            .ToListAsync(ct);

        var myTasks = await _db.WarehouseTasks
            .Where(t => t.WarehouseId == warehouseId
                     && t.ScheduledAt.HasValue
                     && DateOnly.FromDateTime(t.ScheduledAt.Value) >= from
                     && DateOnly.FromDateTime(t.ScheduledAt.Value) <= to)
            .Include(t => t.TaskType)
            .ToListAsync(ct);

        // Group tasks by date
        var taskByDate = myTasks
            .GroupBy(t => DateOnly.FromDateTime(t.ScheduledAt!.Value).ToString("yyyy-MM-dd"))
            .ToDictionary(
                g => g.Key,
                g => g.Select(t => new TaskSlotDto
                {
                    TaskId       = t.Id,
                    TaskTypeName = t.TaskType.Name,
                    TaskTypeCode = t.TaskType.Code,
                    Status       = t.Status,
                    Note         = t.Note,
                    ScheduledAt  = t.ScheduledAt?.ToString("yyyy-MM-ddTHH:mm"),
                }).ToList());

        // Build shift map – even dates with no shift but with tasks should appear
        var allDates = shifts.Select(s => s.ShiftDate.ToString("yyyy-MM-dd"))
            .Union(taskByDate.Keys)
            .Distinct();

        var shiftDict = shifts.ToDictionary(s => s.ShiftDate.ToString("yyyy-MM-dd"));

        var slotMap = allDates.ToDictionary(
            date => date,
            date =>
            {
                shiftDict.TryGetValue(date, out var shift);
                taskByDate.TryGetValue(date, out var tasks);

                bool isEarly = false;
                if (shift?.CheckOutAt != null && !string.IsNullOrEmpty(shift.TimeOut1))
                {
                    var shiftEnd = ComputeShiftEnd(shift.ShiftDate, shift.TimeIn1, shift.TimeOut1, shift.OvertimeHours);
                    isEarly = shift.CheckOutAt.Value < shiftEnd;
                }

                return (ShiftSlotDto?)new ShiftSlotDto
                {
                    StaffShiftId  = shift?.Id,
                    TimeIn1       = shift?.TimeIn1,
                    TimeOut1      = shift?.TimeOut1,
                    TimeIn2       = shift?.TimeIn2,
                    TimeOut2      = shift?.TimeOut2,
                    ShiftType     = shift?.ShiftType,
                    OvertimeHours = shift?.OvertimeHours ?? 0,
                    Tasks         = tasks ?? new List<TaskSlotDto>(),
                    CheckInAt     = shift?.CheckInAt,
                    CheckInPhoto  = shift?.CheckInPhoto,
                    CheckOutAt    = shift?.CheckOutAt,
                    CheckOutPhoto = shift?.CheckOutPhoto,
                    IsEarlyLeave  = isEarly,
                };
            });


        return new StaffScheduleDto
        {
            MembershipId = membership.Id,
            FullName     = membership.User!.FullName ?? "",
            Email        = membership.User.Email ?? "",
            Phone        = membership.User.Phone,
            RoleCode     = membership.Role.Code,
            Skills       = membership.Skills.Select(s => s.Name).ToList(),
            Zones        = membership.Zones.Select(z => z.Name).ToList(),
            Shifts       = slotMap,
        };
    }



    // ── SaveShiftsAsync (Upsert) ───────────────────────────────────────────────
    public async Task SaveShiftsAsync(
        List<UpsertShiftDto> shifts,
        CancellationToken ct = default)
    {
        if (!shifts.Any()) return;

        foreach (var dto in shifts)
        {
            if (!DateOnly.TryParseExact(dto.ShiftDate, "yyyy-MM-dd", null,
                    System.Globalization.DateTimeStyles.None, out var date))
                continue;

            var existing = await _db.StaffShifts
                .FirstOrDefaultAsync(s => s.MembershipId == dto.MembershipId && s.ShiftDate == date, ct);

            if (existing != null)
            {
                // Update
                existing.TimeIn1      = NullIfEmpty(dto.TimeIn1);
                existing.TimeOut1     = NullIfEmpty(dto.TimeOut1);
                existing.TimeIn2      = NullIfEmpty(dto.TimeIn2);
                existing.TimeOut2     = NullIfEmpty(dto.TimeOut2);
                existing.ShiftType    = NullIfEmpty(dto.ShiftType);
                existing.OvertimeHours = dto.OvertimeHours;
            }
            else
            {
                // Insert
                _db.StaffShifts.Add(new StaffShift
                {
                    MembershipId  = dto.MembershipId,
                    ShiftDate     = date,
                    TimeIn1       = NullIfEmpty(dto.TimeIn1),
                    TimeOut1      = NullIfEmpty(dto.TimeOut1),
                    TimeIn2       = NullIfEmpty(dto.TimeIn2),
                    TimeOut2      = NullIfEmpty(dto.TimeOut2),
                    ShiftType     = NullIfEmpty(dto.ShiftType),
                    OvertimeHours = dto.OvertimeHours,
                });
            }
        }

        await _db.SaveChangesAsync(ct);
    }

    private static string? NullIfEmpty(string? v)
        => string.IsNullOrWhiteSpace(v) ? null : v;

    public async Task<List<WarehouseShiftLookupDto>> GetWarehouseShiftsAsync(
        int warehouseId,
        CancellationToken ct = default)
    {
        return await _db.WarehouseShifts
            .Where(s => s.WarehouseId == null || s.WarehouseId == warehouseId)
            .OrderBy(s => s.StartTime)
            .Select(s => new WarehouseShiftLookupDto
            {
                Id          = s.Id,
                Name        = s.Name,
                StartTime   = s.StartTime,
                EndTime     = s.EndTime,
                WarehouseId = s.WarehouseId,
            })
            .ToListAsync(ct);
    }

    public async Task<GenerateScheduleSummary> GenerateScheduleAsync(
        int warehouseId,
        DateOnly from,
        DateOnly to,
        CancellationToken ct = default)
    {
        var memberships = await _db.WarehouseMemberships
            .Include(m => m.Role)
            .Where(m => m.WarehouseId == warehouseId
                     && m.IsActive
                     && m.WarehouseShiftId != null
                     && m.Role.Code == "STAFF")
            .Include(m => m.WarehouseShift)
            .ToListAsync(ct);

        if (memberships.Count == 0)
            return new GenerateScheduleSummary
            {
                Message = "Không có nhân viên nào có loại ca được gán.",
                Created = 0,
                Skipped = 0,
            };

        var mids = memberships.Select(m => m.Id).ToList();
        var existing = await _db.StaffShifts
            .Where(s => mids.Contains(s.MembershipId)
                     && s.ShiftDate >= from
                     && s.ShiftDate <= to)
            .Select(s => new { s.MembershipId, s.ShiftDate })
            .ToListAsync(ct);
        var existingSet = existing.Select(s => (s.MembershipId, s.ShiftDate)).ToHashSet();

        int created = 0, skipped = 0;
        for (var date = from; date <= to; date = date.AddDays(1))
        {
            foreach (var m in memberships)
            {
                if (existingSet.Contains((m.Id, date))) { skipped++; continue; }
                _db.StaffShifts.Add(new WMS.Domain.Entities.StaffShift
                {
                    MembershipId = m.Id,
                    ShiftDate    = date,
                    TimeIn1      = m.WarehouseShift!.StartTime,
                    TimeOut1     = m.WarehouseShift!.EndTime,
                    TimeIn2      = null,
                    TimeOut2     = null,
                    ShiftType    = null,
                });
                created++;
            }
        }
        await _db.SaveChangesAsync(ct);

        return new GenerateScheduleSummary
        {
            Message = $"Generate hoàn tất: {created} mới, {skipped} đã có.",
            Created = created,
            Skipped = skipped,
        };
    }

    // Helper: tinh thoi diem ket thuc ca (xu ly ca dem va tang ca)
    private static DateTime ComputeShiftEnd(DateOnly shiftDate, string? timeIn, string? timeOut, decimal overtimeHours)
    {
        if (string.IsNullOrEmpty(timeOut)) return shiftDate.ToDateTime(TimeOnly.MaxValue);

        var outTime = TimeOnly.Parse(timeOut);
        var baseDate = shiftDate.ToDateTime(outTime);

        // Ca dem: gio ra nho hon gio vao thi qua ngay hom sau
        if (!string.IsNullOrEmpty(timeIn))
        {
            var inTime = TimeOnly.Parse(timeIn);
            if (outTime < inTime)
                baseDate = baseDate.AddDays(1);
        }

        return baseDate.AddHours((double)overtimeHours);
    }

    // ── GetByIdAsync ──────────────────────────────────────────────────────────
    public async Task<WMS.Domain.Entities.StaffShift?> GetByIdAsync(int staffShiftId, CancellationToken ct = default)
        => await _db.StaffShifts
            .Include(s => s.Membership)
            .FirstOrDefaultAsync(s => s.Id == staffShiftId, ct);

    // ── RecordCheckInAsync ────────────────────────────────────────────────────
    public async Task RecordCheckInAsync(int staffShiftId, DateTime capturedAt, string photoUrl, CancellationToken ct = default)
    {
        var shift = await _db.StaffShifts.FindAsync(new object[] { staffShiftId }, ct)
            ?? throw new KeyNotFoundException("Khong tim thay ca lam viec.");
        shift.CheckInAt    = capturedAt;
        shift.CheckInPhoto = photoUrl;
        await _db.SaveChangesAsync(ct);
    }

    // ── RecordCheckOutAsync (ghi de moi lan) ──────────────────────────────────
    public async Task RecordCheckOutAsync(int staffShiftId, DateTime capturedAt, string photoUrl, CancellationToken ct = default)
    {
        var shift = await _db.StaffShifts.FindAsync(new object[] { staffShiftId }, ct)
            ?? throw new KeyNotFoundException("Khong tim thay ca lam viec.");
        shift.CheckOutAt    = capturedAt;
        shift.CheckOutPhoto = photoUrl;
        await _db.SaveChangesAsync(ct);
    }

    // ── SetOvertimeAsync ──────────────────────────────────────────────────────
    public async Task SetOvertimeAsync(int staffShiftId, decimal hours, CancellationToken ct = default)
    {
        var shift = await _db.StaffShifts.FindAsync(new object[] { staffShiftId }, ct)
            ?? throw new KeyNotFoundException("Khong tim thay ca lam viec.");
        shift.OvertimeHours = hours;
        await _db.SaveChangesAsync(ct);
    }

    // ── BulkSetOvertimeAsync ──────────────────────────────────────────────────
    public async Task BulkSetOvertimeAsync(int warehouseId, DateOnly date, List<int> membershipIds, decimal hours, CancellationToken ct = default)
    {
        var shifts = await _db.StaffShifts
            .Where(s => membershipIds.Contains(s.MembershipId)
                     && s.ShiftDate == date
                     && s.Membership.WarehouseId == warehouseId)
            .ToListAsync(ct);

        foreach (var s in shifts)
            s.OvertimeHours = hours;

        await _db.SaveChangesAsync(ct);
    }
}
