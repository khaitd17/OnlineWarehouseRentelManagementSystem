using MediatR;

namespace WMS.Application.Features.RentalAreas.UpdateRentalArea;

public class UpdateRentalAreaCommand : IRequest<bool>
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public double Size { get; set; }
    public string? Description { get; set; }
}
