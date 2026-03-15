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

        var rentalArea = new RentalArea
        {
            WarehouseId = request.WarehouseId,
            Name = request.Name,
            Size = request.Size,
            Description = request.Description
        };

        return await _rentalAreaRepository.CreateAsync(rentalArea, cancellationToken);
    }
}
