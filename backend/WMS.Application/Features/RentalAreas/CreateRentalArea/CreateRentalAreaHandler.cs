using MediatR;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalAreas.CreateRentalArea;

public class CreateRentalAreaHandler : IRequestHandler<CreateRentalAreaCommand, int>
{
    private readonly IRentalAreaRepository _rentalAreaRepository;
    private readonly IWarehouseRepository _warehouseRepository;

    public CreateRentalAreaHandler(IRentalAreaRepository rentalAreaRepository, IWarehouseRepository warehouseRepository)
    {
        _rentalAreaRepository = rentalAreaRepository;
        _warehouseRepository = warehouseRepository;
    }

    public async Task<int> Handle(CreateRentalAreaCommand request, CancellationToken cancellationToken)
    {
        var warehouse = await _warehouseRepository.GetByIdAsync(request.WarehouseId, cancellationToken);
        if (warehouse == null)
        {
            throw new Exception("Warehouse not found");
        }

        var totalAllocated = await _rentalAreaRepository.GetTotalAllocatedAreaAsync(request.WarehouseId, cancellationToken);
        
        if (totalAllocated + request.Size > warehouse.TotalArea)
        {
            throw new Exception($"Cannot create rental area. Warehouse capacity exceeded. Max available: {warehouse.TotalArea - totalAllocated}");
        }

        // Validate overlap
        if (request.PositionX.HasValue && request.PositionY.HasValue && request.Width.HasValue && request.Length.HasValue)
        {
            var existingAreas = await _rentalAreaRepository.GetByWarehouseIdAsync(request.WarehouseId, cancellationToken);
            foreach (var existing in existingAreas)
            {
                if (existing.PositionX.HasValue && existing.PositionY.HasValue && existing.Width.HasValue && existing.Length.HasValue)
                {
                    bool overlapX = request.PositionX < (existing.PositionX + existing.Width) && 
                                    (request.PositionX + request.Width) > existing.PositionX;
                    bool overlapY = request.PositionY < (existing.PositionY + existing.Length) && 
                                    (request.PositionY + request.Length) > existing.PositionY;

                    if (overlapX && overlapY)
                    {
                        throw new Exception($"Rental area overlaps with existing area: {existing.Name}");
                    }
                }
            }
        }

        var rentalArea = new RentalArea
        {
            WarehouseId = request.WarehouseId,
            Name = request.Name,
            Size = request.Size,
            Description = request.Description,
            PositionX = request.PositionX,
            PositionY = request.PositionY,
            Width = request.Width,
            Length = request.Length
        };

        return await _rentalAreaRepository.CreateAsync(rentalArea, cancellationToken);
    }
}
