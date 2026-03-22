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
        var ownerId = await _repository.FindWarehouseOwnerById(
            request.WarehouseId,
            cancellationToken
        );

        if (ownerId == null)
            throw new Exception("Warehouse not found");

        if (ownerId != request.OwnerId)
            throw new UnauthorizedAccessException("You are not the owner");

        var warehouse = new Warehouse
        {
            WarehouseId = request.WarehouseId,
            OwnerId = request.OwnerId,
            Name = request.Name,
            Address = request.Address,
            Lat = request.Lat,
            Lng = request.Lng,
            Description = request.Description,
            OperatingHours = request.OperatingHours,
            Is24HoursAccess = request.Is24HoursAccess,
            OpenTime = request.OpenTime,
            CloseTime = request.CloseTime,
            MainDoorDirection = request.MainDoorDirection,
            Status = request.Status
        };

        await _repository.UpdateAsync(warehouse, cancellationToken);
    }
}