using System;
using System.Collections.Generic;

namespace WMS.Domain.Entities;

public partial class WarehouseRole
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public ICollection<WarehouseMembership> Memberships { get; set; } = new List<WarehouseMembership>();
}
