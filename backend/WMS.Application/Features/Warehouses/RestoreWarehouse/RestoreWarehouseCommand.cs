using MediatR;

namespace WMS.Application.Features.Warehouses.RestoreWarehouse;

public class RestoreWarehouseCommand : IRequest<bool>
{
    public int WarehouseId { get; set; }
    public int CallerId { get; set; }
}
