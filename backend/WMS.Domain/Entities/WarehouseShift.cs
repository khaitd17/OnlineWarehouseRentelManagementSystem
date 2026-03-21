namespace WMS.Domain.Entities;

public class WarehouseShift
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string StartTime { get; set; } = null!;
    public string EndTime { get; set; } = null!;
    public int? WarehouseId { get; set; }
    public Warehouse? Warehouse { get; set; }
}
