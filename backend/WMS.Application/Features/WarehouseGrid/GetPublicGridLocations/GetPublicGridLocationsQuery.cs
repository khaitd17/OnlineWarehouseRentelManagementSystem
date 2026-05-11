using MediatR;
using System.Collections.Generic;

namespace WMS.Application.Features.WarehouseGrid.GetPublicGridLocations;

public class GetPublicGridLocationsQuery : IRequest<List<PublicGridLocationDto>>
{
    public int WarehouseId { get; set; }
}

public class PublicGridLocationDto
{
    public int Id { get; set; }
    public string Coordinates { get; set; } = null!;
}
