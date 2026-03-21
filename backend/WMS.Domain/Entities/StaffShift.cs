using System;

namespace WMS.Domain.Entities;

public class StaffShift
{
    public int Id { get; set; }

    public int MembershipId { get; set; }

    public DateOnly ShiftDate { get; set; }

    /// <summary>Giờ vào ca 1 dạng "HH:mm", null nếu không nhập.</summary>
    public string? TimeIn1 { get; set; }

    /// <summary>Giờ về ca 1 dạng "HH:mm".</summary>
    public string? TimeOut1 { get; set; }

    /// <summary>Giờ vào ca 2 dạng "HH:mm".</summary>
    public string? TimeIn2 { get; set; }

    /// <summary>Giờ về ca 2 dạng "HH:mm".</summary>
    public string? TimeOut2 { get; set; }

    /// <summary>Loại ca đặc biệt: null = Thường, "NC" = Nghỉ ca, "OFF" = Ngày off, "CD" = Cả ngày.</summary>
    public string? ShiftType { get; set; }

    public WarehouseMembership Membership { get; set; } = null!;
}
