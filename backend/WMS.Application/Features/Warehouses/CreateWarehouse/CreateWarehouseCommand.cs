using MediatR;

namespace WMS.Application.Features.Warehouses.CreateWarehouse;

public class CreateWarehouseCommand : IRequest<int>
{
    public int OwnerId { get; set; }

    public string Name { get; set; } = null!;

    public string Address { get; set; } = null!;

    public double? Lat { get; set; }

    public double? Lng { get; set; }

    public string? Description { get; set; }

    public string? WarehouseType { get; set; }

    public double TotalArea { get; set; }

    public double? Height { get; set; }

    public string? OperatingHours { get; set; }

    public bool Is24HoursAccess { get; set; }

    public TimeSpan? OpenTime { get; set; }

    public TimeSpan? CloseTime { get; set; }
    public string? MainDoorDirection { get; set; }
    public string? Status { get; set; }
    public decimal? PricePerM2 { get; set; }

    /// <summary>Polygon boundary JSON from floor plan drawing. Format: [{gx,gy},...], 1 unit = 0.5m. Optional.</summary>
    public string? BoundaryPoints { get; set; }
    
    public string? GatePosition { get; set; }
}