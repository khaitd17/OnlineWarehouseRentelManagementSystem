using System;

namespace WMS.Domain.Entities;

public class StaffShift
{
    public int Id { get; set; }

    public int MembershipId { get; set; }

    public DateOnly ShiftDate { get; set; }

    // Gio vao ca dang "HH:mm"
    public string? TimeIn1 { get; set; }

    // Gio ra ca dang "HH:mm"
    public string? TimeOut1 { get; set; }

    // Gio vao ca 2 (neu co)
    public string? TimeIn2 { get; set; }

    // Gio ra ca 2 (neu co)
    public string? TimeOut2 { get; set; }

    // Loai ca: null = binh thuong, "NC" = nghi ca, "OFF" = ngay off
    public string? ShiftType { get; set; }

    // So gio tang ca (0 = khong OT)
    public decimal OvertimeHours { get; set; } = 0;

    // Thoi diem check-in thuc te (null = chua diem danh vao)
    public DateTime? CheckInAt { get; set; }

    // Anh bang chung check-in
    public string? CheckInPhoto { get; set; }

    // Thoi diem check-out lan cuoi (null = chua diem danh ra, ghi de moi lan check-out lai)
    public DateTime? CheckOutAt { get; set; }

    // Anh bang chung check-out lan cuoi
    public string? CheckOutPhoto { get; set; }

    public WarehouseMembership Membership { get; set; } = null!;
}
