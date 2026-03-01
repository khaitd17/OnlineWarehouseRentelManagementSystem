using MediatR;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Warehouses.CreateWarehouse;

public class CreateWarehouseHandler : IRequestHandler<CreateWarehouseCommand, int>
{
    private readonly IWarehouseRepository _repository;

    public CreateWarehouseHandler(IWarehouseRepository repository)
    {
        _repository = repository;
    }

    public async Task<int> Handle(CreateWarehouseCommand request, CancellationToken cancellationToken)
    {
        var warehouse = new Warehouse(
            request.Name,
            request.Description,
            request.Address,
            request.City,
            request.Province,
            request.Area,
            request.PricePerMonth,
            request.WarehouseType,
            request.Capacity,
            request.OwnerId
        );

        await _repository.AddAsync(warehouse);

        return warehouse.Id;
    }
}