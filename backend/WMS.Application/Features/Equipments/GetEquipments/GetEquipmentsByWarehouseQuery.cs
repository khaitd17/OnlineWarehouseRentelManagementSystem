using MediatR;

namespace WMS.Application.Features.Equipments.GetEquipments;

public class GetEquipmentsByWarehouseQuery : IRequest<List<EquipmentDto>>
{
    public int WarehouseId { get; set; }
    public int RequestUserId { get; set; }
}
