using MediatR;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Warehouses.UpdateWarehouse;

public class UpdateWarehouseHandler : IRequestHandler<UpdateWarehouseCommand>
{
    private readonly IWarehouseRepository _repository;

    public UpdateWarehouseHandler(IWarehouseRepository repository)
    {
        _repository = repository;
    }

    public async Task Handle(UpdateWarehouseCommand request, CancellationToken cancellationToken)
    {
        var warehouse = await _repository.GetByIdAsync(request.WarehouseId, cancellationToken);
        if (warehouse == null)
            throw new Exception("Warehouse not found");

        if (warehouse.OwnerId != request.OwnerId)
            throw new UnauthorizedAccessException("You are not the owner");

        // Maintain current occupancy by recalculating available area
        var rentedArea = warehouse.TotalArea - warehouse.AvailableArea;
        
        warehouse.Name = request.Name;
        warehouse.Address = request.Address;
        warehouse.Lat = request.Lat;
        warehouse.Lng = request.Lng;
        warehouse.Description = request.Description;
        warehouse.OperatingHours = request.OperatingHours;
        warehouse.Is24HoursAccess = request.Is24HoursAccess;
        warehouse.OpenTime = request.OpenTime;
        warehouse.CloseTime = request.CloseTime;
        warehouse.TotalArea = request.TotalArea;
        warehouse.Width = request.Width;
        warehouse.Length = request.Length;
        warehouse.AvailableArea = request.TotalArea - rentedArea;
        warehouse.MainDoorDirection = request.MainDoorDirection;
        warehouse.Status = request.Status ?? warehouse.Status;

        await _repository.UpdateAsync(warehouse, cancellationToken);
    }
}