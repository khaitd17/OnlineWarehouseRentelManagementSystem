using MediatR;

namespace WMS.Application.Features.Equipments.TransferEquipment;

public class TransferEquipmentCommand : IRequest
{
    public int EquipmentId { get; set; }
    public int? NewRentalAreaId { get; set; }
    public string? Note { get; set; }
    public int RequestUserId { get; set; }
}
