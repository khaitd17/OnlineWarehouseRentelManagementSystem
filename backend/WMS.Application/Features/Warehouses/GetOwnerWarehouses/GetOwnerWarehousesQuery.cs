using MediatR;
using WMS.Domain.Entities;

namespace WMS.Application.Features.Warehouses.GetOwnerWarehouses;

public class GetOwnerWarehousesQuery : IRequest<List<Warehouse>>
{
    public int OwnerId { get; set; }

    public GetOwnerWarehousesQuery(int ownerId)
    {
        OwnerId = ownerId;
    }
}