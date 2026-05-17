using MediatR;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.WarehouseGrid.GetRenterSpaceUsage;

public class GetRenterSpaceUsageHandler : IRequestHandler<GetRenterSpaceUsageQuery, RenterSpaceUsageDto>
{
    private readonly IRentalContractRepository _contractRepo;
    private readonly IWarehouseGridLocationRepository _gridRepo;

    public GetRenterSpaceUsageHandler(IRentalContractRepository contractRepo, IWarehouseGridLocationRepository gridRepo)
    {
        _contractRepo = contractRepo;
        _gridRepo = gridRepo;
    }

    public async Task<RenterSpaceUsageDto> Handle(GetRenterSpaceUsageQuery request, CancellationToken cancellationToken)
    {
        var contractedArea = await _contractRepo.GetContractedAreaAsync(request.RenterId, request.WarehouseId, cancellationToken);
        
        var locations = await _gridRepo.GetByWarehouseAsync(request.WarehouseId, request.RenterId, cancellationToken);
        
        var uniqueCells = new HashSet<string>();
        foreach (var loc in locations)
        {
            if (!string.IsNullOrEmpty(loc.Coordinates))
            {
                try
                {
                    var coords = JsonSerializer.Deserialize<List<Coordinate>>(loc.Coordinates, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (coords != null)
                    {
                        foreach (var c in coords)
                        {
                            uniqueCells.Add($"{c.X}_{c.Y}");
                        }
                    }
                }
                catch
                {
                    // Ignore parsing errors
                }
            }
        }

        int occupiedCells = uniqueCells.Count;
        double occupiedArea = occupiedCells * 0.25;

        return new RenterSpaceUsageDto
        {
            ContractedArea = contractedArea,
            OccupiedCells = occupiedCells,
            OccupiedArea = occupiedArea
        };
    }

    private class Coordinate
    {
        public int X { get; set; }
        public int Y { get; set; }
    }
}
