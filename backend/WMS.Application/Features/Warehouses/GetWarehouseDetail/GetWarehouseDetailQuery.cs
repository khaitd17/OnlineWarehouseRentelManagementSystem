using MediatR;

namespace WMS.Application.Features.Warehouses.GetWarehouseDetail;

public class GetWarehouseDetailQuery : IRequest<WarehouseDetailDto>
{
    public int WarehouseId { get; set; }
}