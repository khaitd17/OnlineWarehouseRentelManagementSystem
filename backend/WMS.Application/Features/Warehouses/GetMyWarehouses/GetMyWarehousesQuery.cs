using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Warehouses.GetMyWarehouses;

public class GetMyWarehousesQuery : IRequest<List<MyWarehouseItemDto>>
{
    public int UserId { get; set; }
}
