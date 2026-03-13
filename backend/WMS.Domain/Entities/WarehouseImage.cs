namespace WMS.Domain.Entities;

public class WarehouseImage
{
    public int ImageId { get; set; }

    public int WarehouseId { get; set; }

    public string Url { get; set; } = null!;

    // Navigation property
    public Warehouse? Warehouse { get; set; }
}