using MediatR;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Warehouses.GetOwnerWarehouses;

public class GetOwnerWarehousesHandler
    : IRequestHandler<GetOwnerWarehousesQuery, List<Warehouse>>
{
    private readonly IWarehouseRepository _repository;

    public GetOwnerWarehousesHandler(IWarehouseRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<Warehouse>> Handle(
        GetOwnerWarehousesQuery request,
        CancellationToken cancellationToken)
    {
        return await _repository.GetByOwnerIdAsync(
            request.OwnerId,
            cancellationToken
        );
    }
}