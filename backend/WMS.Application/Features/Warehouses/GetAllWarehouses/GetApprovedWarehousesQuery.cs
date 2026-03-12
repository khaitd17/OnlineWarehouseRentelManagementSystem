using MediatR;

namespace WMS.Application.Features.Warehouses.GetAllWarehouses;

public class GetApprovedWarehousesQuery : IRequest<List<ApprovedWarehouseDto>>
{
    public int Limit { get; set; } = 6;
}

public class ApprovedWarehouseDto
{
    public int WarehouseId { get; set; }
    public string Name { get; set; } = null!;
    public string Address { get; set; } = null!;
    public string? Description { get; set; }
    public double TotalArea { get; set; }
    public double AvailableArea { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime CreatedAt { get; set; }
}
