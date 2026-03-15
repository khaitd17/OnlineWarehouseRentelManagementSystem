namespace WMS.Application.Features.Equipments;

public class EquipmentDto
{
    public int EquipmentId { get; set; }
    public int WarehouseId { get; set; }
    public string Name { get; set; } = null!;
    public string? Type { get; set; }
    public string? Location { get; set; }
    public string? Description { get; set; }
    public string? Status { get; set; }
    public string? Specifications { get; set; }
    public string? IotDeviceId { get; set; }
    public DateTime? LastUpdated { get; set; }
}
