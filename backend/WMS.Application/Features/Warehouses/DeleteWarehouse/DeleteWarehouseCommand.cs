using MediatR;

namespace WMS.Application.Features.Warehouses.DeleteWarehouse;

public class DeleteWarehouseCommand : IRequest<bool>
{
    public int WarehouseId { get; set; }
    public int CallerId { get; set; }
}
