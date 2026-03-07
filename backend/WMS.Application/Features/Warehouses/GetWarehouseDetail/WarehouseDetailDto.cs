namespace WMS.Application.Features.Warehouses.GetWarehouseDetail;

public class WarehouseDetailDto
{
    public int WarehouseId { get; set; }

    public int OwnerId { get; set; }

    public string Name { get; set; } = null!;

    public string Address { get; set; } = null!;

    public double? Lat { get; set; }

    public double? Lng { get; set; }

    public string? Description { get; set; }

    public double TotalArea { get; set; }

    public double AvailableArea { get; set; }

    public string? OperatingHours { get; set; }

    public string? Status { get; set; }

    public DateTime? CreatedAt { get; set; }
}