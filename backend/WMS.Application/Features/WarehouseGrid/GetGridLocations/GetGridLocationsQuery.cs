using MediatR;
using System.Collections.Generic;

namespace WMS.Application.Features.WarehouseGrid.GetGridLocations;

public class GetGridLocationsQuery : IRequest<List<WarehouseGridLocationDto>>
{
    public int WarehouseId { get; set; }
    public int? RenterId { get; set; }
}

public class WarehouseGridLocationDto
{
    public int Id { get; set; }
    public string Coordinates { get; set; } = null!;
    public int? AssetId { get; set; }
    public string? ItemName { get; set; }
    public int? RenterId { get; set; }
    public string? RenterName { get; set; }
    public int Quantity { get; set; }
    public System.DateTime? UpdatedAt { get; set; }
}
