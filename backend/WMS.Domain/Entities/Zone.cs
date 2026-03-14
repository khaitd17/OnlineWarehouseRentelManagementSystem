using System;
using System.Collections.Generic;

namespace WMS.Domain.Entities;

public partial class Zone
{
    public int Id { get; set; }

    public int WarehouseId { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual Warehouse Warehouse { get; set; } = null!;

    public virtual ICollection<WarehouseMembership> Memberships { get; set; } = new List<WarehouseMembership>();
}
