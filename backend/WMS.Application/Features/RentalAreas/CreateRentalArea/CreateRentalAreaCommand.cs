using MediatR;

namespace WMS.Application.Features.RentalAreas.CreateRentalArea;

public class CreateRentalAreaCommand : IRequest<int>
{
    public int WarehouseId { get; set; }
    public string Name { get; set; } = null!;
    public double Size { get; set; }
    public string? Description { get; set; }
    public double? PositionX { get; set; }
    public double? PositionY { get; set; }
    public double? Width { get; set; }
    public double? Length { get; set; }
}
