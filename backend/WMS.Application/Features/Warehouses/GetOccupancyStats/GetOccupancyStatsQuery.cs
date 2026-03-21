using MediatR;

namespace WMS.Application.Features.Warehouses.GetOccupancyStats;

public class GetOccupancyStatsQuery : IRequest<OccupancyStatsDto>
{
    public int OwnerId { get; set; }

    public GetOccupancyStatsQuery(int ownerId)
    {
        OwnerId = ownerId;
    }
}
