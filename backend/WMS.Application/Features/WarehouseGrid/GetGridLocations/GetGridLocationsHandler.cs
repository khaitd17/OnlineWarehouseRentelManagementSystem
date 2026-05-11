using MediatR;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.WarehouseGrid.GetGridLocations;

public class GetGridLocationsHandler : IRequestHandler<GetGridLocationsQuery, List<WarehouseGridLocationDto>>
{
    private readonly IWarehouseGridLocationRepository _gridRepo;

    public GetGridLocationsHandler(IWarehouseGridLocationRepository gridRepo)
    {
        _gridRepo = gridRepo;
    }

    public async Task<List<WarehouseGridLocationDto>> Handle(GetGridLocationsQuery request, CancellationToken cancellationToken)
    {
        var locations = await _gridRepo.GetByWarehouseAsync(request.WarehouseId, request.RenterId, cancellationToken);
        
        var result = locations.Select(g => new WarehouseGridLocationDto
        {
            Id = g.Id,
            Coordinates = g.Coordinates,
            AssetId = g.AssetId,
            ItemName = g.ItemName,
            RenterId = g.RenterId,
            RenterName = g.Renter?.FullName ?? g.Asset?.Renter?.FullName,
            Quantity = g.Quantity,
            UpdatedAt = g.UpdatedAt
        }).ToList();

        return result;
    }
}
