using MediatR;
using System.Collections.Generic;

namespace WMS.Application.Features.WarehouseGrid.AssignGridLocations;

public class AssignGridLocationsCommand : IRequest
{
    public int WarehouseId { get; set; }
    public List<CoordinateDto> Coordinates { get; set; } = new();
    public int? AssetId { get; set; }
    public string? ItemName { get; set; }
    public int? RenterId { get; set; }
    public int Quantity { get; set; }
}

public class CoordinateDto
{
    public decimal x { get; set; }
    public decimal y { get; set; }
}
