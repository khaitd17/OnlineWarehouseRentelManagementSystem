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
        var warehouse = new Warehouse
        {
            OwnerId = request.OwnerId,
            Name = request.Name,
            Address = request.Address,
            Lat = request.Lat,
            Lng = request.Lng,
            Description = request.Description,
            TotalArea = request.TotalArea,
            AvailableArea = request.TotalArea,
            OperatingHours = request.OperatingHours,
            Status = "PENDING"
        };

        var warehouseId = await _repository.CreateAsync(warehouse, cancellationToken);

        return warehouseId;
    }
}