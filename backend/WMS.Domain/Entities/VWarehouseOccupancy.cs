using System;
using System.Collections.Generic;

namespace WMS.Domain.Entities;

public partial class VWarehouseOccupancy
{
    public int WarehouseId { get; set; }

    public string Name { get; set; } = null!;

    public double TotalArea { get; set; }

    public double AvailableArea { get; set; }

    public double OccupiedArea { get; set; }
    public double ReservedArea { get; set; }

    public double OccupancyRate { get; set; }
}
