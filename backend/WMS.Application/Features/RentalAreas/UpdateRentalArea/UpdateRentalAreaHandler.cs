using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalAreas.UpdateRentalArea;

public class UpdateRentalAreaHandler : IRequestHandler<UpdateRentalAreaCommand, bool>
{
    private readonly IRentalAreaRepository _rentalAreaRepository;
    private readonly IWarehouseRepository _warehouseRepository;

    public UpdateRentalAreaHandler(IRentalAreaRepository rentalAreaRepository, IWarehouseRepository warehouseRepository)
    {
        _rentalAreaRepository = rentalAreaRepository;
        _warehouseRepository = warehouseRepository;
    }

    public async Task<bool> Handle(UpdateRentalAreaCommand request, CancellationToken cancellationToken)
    {
        var rentalArea = await _rentalAreaRepository.GetByIdAsync(request.Id, cancellationToken);
        if (rentalArea == null)
        {
            throw new Exception("Rental area not found");
        }

        var warehouse = await _warehouseRepository.GetByIdAsync(rentalArea.WarehouseId, cancellationToken);
        if (warehouse == null)
        {
            throw new Exception("Warehouse not found");
        }

        double totalAllocated = await _rentalAreaRepository.GetTotalAllocatedAreaAsync(rentalArea.WarehouseId, cancellationToken);
        
        // Subtract old size and add new size to check capacity
        if (totalAllocated - rentalArea.Size + request.Size > warehouse.TotalArea)
        {
            throw new Exception($"Cannot update rental area. Warehouse capacity exceeded. Max available: {warehouse.TotalArea - (totalAllocated - rentalArea.Size)}");
        }

        // Validate overlap
        if (request.PositionX.HasValue && request.PositionY.HasValue && request.Width.HasValue && request.Length.HasValue)
        {
            var existingAreas = await _rentalAreaRepository.GetByWarehouseIdAsync(rentalArea.WarehouseId, cancellationToken);
            foreach (var existing in existingAreas)
            {
                if (existing.Id != request.Id && 
                    existing.PositionX.HasValue && existing.PositionY.HasValue && 
                    existing.Width.HasValue && existing.Length.HasValue)
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

        rentalArea.Name = request.Name;
        rentalArea.Size = request.Size;
        rentalArea.Description = request.Description;
        rentalArea.PositionX = request.PositionX;
        rentalArea.PositionY = request.PositionY;
        rentalArea.Width = request.Width;
        rentalArea.Length = request.Length;

        await _rentalAreaRepository.UpdateAsync(rentalArea, cancellationToken);
        
        return true;
    }
}
