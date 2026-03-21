using MediatR;

namespace WMS.Application.Features.Equipments.ControlEquipment;

public class ControlEquipmentCommand : IRequest<string>
{
    public int EquipmentId { get; set; }
    public string Command { get; set; } = null!;
    public int RequestUserId { get; set; }
}
