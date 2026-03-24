using MediatR;

namespace WMS.Application.Features.Equipments.UpdateEquipmentStatus;

public class UpdateEquipmentStatusCommand : IRequest
{
    public int EquipmentId { get; set; }
    public string Status { get; set; } = null!;
    public string? Note { get; set; }
    public int RequestUserId { get; set; }
}
