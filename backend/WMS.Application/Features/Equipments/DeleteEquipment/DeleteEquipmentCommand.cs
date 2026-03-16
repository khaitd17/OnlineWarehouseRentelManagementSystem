using MediatR;

namespace WMS.Application.Features.Equipments.DeleteEquipment;

public class DeleteEquipmentCommand : IRequest
{
    public int EquipmentId { get; set; }
    public int RequestUserId { get; set; }
}
