using System;
using System.Collections.Generic;

namespace WMS.Domain.Entities;

public class WarehouseMembership
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public int WarehouseId { get; set; }

    public int WarehouseRoleId { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsAllSkill { get; set; } = false;

    /// <summary>true = phụ trách tất cả khu vực (zone), false = chỉ các zone được liệt kê</summary>
    public bool IsAllZone { get; set; } = false;

    public int? WarehouseShiftId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;

    public Warehouse Warehouse { get; set; } = null!;

    public WarehouseRole Role { get; set; } = null!;

    public ICollection<Skill> Skills { get; set; } = new List<Skill>();

    public ICollection<Zone> Zones { get; set; } = new List<Zone>();

    public ICollection<StaffShift> StaffShifts { get; set; } = new List<StaffShift>();

    public WarehouseShift? WarehouseShift { get; set; }
}
