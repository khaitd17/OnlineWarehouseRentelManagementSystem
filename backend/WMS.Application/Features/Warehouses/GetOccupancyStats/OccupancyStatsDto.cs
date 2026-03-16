using System;
using System.Collections.Generic;

namespace WMS.Application.Features.Warehouses.GetOccupancyStats;

public class OccupancyStatsDto
{
    public int TotalWarehouses { get; set; }
    public double TotalGlobalArea { get; set; }
    public double TotalOccupiedArea { get; set; }
    public double TotalReservedArea { get; set; }
    public double TotalAvailableArea { get; set; }
    public double AverageOccupancyRate { get; set; }
    public List<WarehouseOccupancyDto> Warehouses { get; set; } = new();
    public List<OccupancyTrendDto> OccupancyTrends { get; set; } = new();
    public EquipmentSummaryDto EquipmentStats { get; set; } = new();
}

public class WarehouseOccupancyDto
{
    public int WarehouseId { get; set; }
    public string Name { get; set; } = null!;
    public double TotalArea { get; set; }
    public double OccupiedArea { get; set; }
    public double ReservedArea { get; set; }
    public double AvailableArea { get; set; }
    public double OccupancyRate { get; set; }
}

public class OccupancyTrendDto
{
    public string Date { get; set; } = null!;
    public double Rate { get; set; }
}

public class EquipmentSummaryDto
{
    public int TotalEquipment { get; set; }
    public int RentedEquipment { get; set; }
    public int AvailableEquipment { get; set; }
    public double UtilizationPercentage { get; set; }
}
