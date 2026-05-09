using MediatR;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.WarehouseGrid.AssignGridLocations;

public class AssignGridLocationsHandler : IRequestHandler<AssignGridLocationsCommand>
{
    private readonly IWarehouseGridLocationRepository _gridRepo;

    public AssignGridLocationsHandler(IWarehouseGridLocationRepository gridRepo)
    {
        _gridRepo = gridRepo;
    }

    public async Task Handle(AssignGridLocationsCommand request, CancellationToken cancellationToken)
    {
        var assignment = new WarehouseGridLocation
        {
            WarehouseId = request.WarehouseId,
            Coordinates = JsonSerializer.Serialize(request.Coordinates),
            AssetId = request.AssetId,
            ItemName = request.ItemName,
            RenterId = request.RenterId,
            Quantity = request.Quantity
        };

        await _gridRepo.AssignGridLocationsAsync(request.WarehouseId, new List<WarehouseGridLocation> { assignment }, cancellationToken);
    }
}
