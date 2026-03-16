using MediatR;

namespace WMS.Application.Features.RentalAreas.CreateRentalArea;

public class CreateRentalAreaCommand : IRequest<int>
{
    public int WarehouseId { get; set; }
    public string Name { get; set; } = null!;
    public double Size { get; set; }
    public string? Description { get; set; }
}
