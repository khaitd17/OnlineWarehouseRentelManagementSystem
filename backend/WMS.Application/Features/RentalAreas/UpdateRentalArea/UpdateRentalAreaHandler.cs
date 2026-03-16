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

        rentalArea.Name = request.Name;
        rentalArea.Size = request.Size;
        rentalArea.Description = request.Description;

        await _rentalAreaRepository.UpdateAsync(rentalArea, cancellationToken);
        
        return true;
    }
}
