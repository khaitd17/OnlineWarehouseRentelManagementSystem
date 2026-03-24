using MediatR;

namespace WMS.Application.Features.Equipments.UpdateEquipment;

public class UpdateEquipmentCommand : IRequest
{
    public int EquipmentId { get; set; }
    public string Name { get; set; } = null!;
    public string? Type { get; set; }
    public string? SerialNumber { get; set; }
    public string? Location { get; set; }
    public string? Description { get; set; }
    public string? Note { get; set; }
    public string? Specifications { get; set; }
    public int? MaintenanceCycleDays { get; set; }
    public string? IotDeviceId { get; set; }
    public int? RentalAreaId { get; set; }
    public int RequestUserId { get; set; }
}
