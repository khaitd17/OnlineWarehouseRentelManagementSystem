using System;
using System.Collections.Generic;

namespace WMS.Infrastructure.Persistence.ScaffoldModels;

public partial class VActiveWarehouse
{
    public int WarehouseId { get; set; }

    public string Name { get; set; } = null!;

    public string Address { get; set; } = null!;

    public double? Lat { get; set; }

    public double? Lng { get; set; }

    public double TotalArea { get; set; }

    public double AvailableArea { get; set; }

    public string? OperatingHours { get; set; }

    public string OwnerName { get; set; } = null!;

    public string OwnerEmail { get; set; } = null!;

    public string? OwnerPhone { get; set; }

    public double? AvgRating { get; set; }

    public int? TotalRatings { get; set; }
}
