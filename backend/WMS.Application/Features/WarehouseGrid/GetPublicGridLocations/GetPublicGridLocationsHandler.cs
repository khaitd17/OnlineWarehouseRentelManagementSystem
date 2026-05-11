using MediatR;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.WarehouseGrid.GetPublicGridLocations;

public class GetPublicGridLocationsHandler : IRequestHandler<GetPublicGridLocationsQuery, List<PublicGridLocationDto>>
{
    private readonly IWarehouseGridLocationRepository _gridRepo;

    public GetPublicGridLocationsHandler(IWarehouseGridLocationRepository gridRepo)
    {
        _gridRepo = gridRepo;
    }

    public async Task<List<PublicGridLocationDto>> Handle(GetPublicGridLocationsQuery request, CancellationToken cancellationToken)
    {
        var locations = await _gridRepo.GetByWarehouseAsync(request.WarehouseId, null, cancellationToken);
        
        var result = locations.Select(g => new PublicGridLocationDto
        {
            Id = g.Id,
            Coordinates = g.Coordinates
        }).ToList();

        return result;
    }
}
