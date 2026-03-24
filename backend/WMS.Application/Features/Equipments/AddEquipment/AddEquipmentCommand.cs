using MediatR;

namespace WMS.Application.Features.Equipments.AddEquipment;

public class AddEquipmentCommand : IRequest<int>
{
    public int WarehouseId { get; set; }
    public int? RentalAreaId { get; set; }
    public string Name { get; set; } = null!;
    public string? Type { get; set; }
    public string? Location { get; set; }
    public string? Description { get; set; }
    public string? Specifications { get; set; }
    public string? SerialNumber { get; set; }
    public int? MaintenanceCycleDays { get; set; }
    public string? IotDeviceId { get; set; }
    public int RequestUserId { get; set; }
}
