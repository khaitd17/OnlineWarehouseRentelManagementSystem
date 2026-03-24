namespace WMS.Application.Features.Equipments;

public class EquipmentDto
{
    public int EquipmentId { get; set; }
    public int WarehouseId { get; set; }
    public int? RentalAreaId { get; set; }
    public string? RentalAreaName { get; set; }
    public string Name { get; set; } = null!;
    public string? Type { get; set; }
    public string? SerialNumber { get; set; }
    public string? Location { get; set; }
    public string? Description { get; set; }
    public string? Note { get; set; }
    public string? Status { get; set; }
    public string? Specifications { get; set; }
    public int? MaintenanceCycleDays { get; set; }
    public string? IotDeviceId { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? LastUpdated { get; set; }
    public DateOnly? LastMaintenanceDate { get; set; }
    public DateOnly? NextMaintenanceDate { get; set; }
}
