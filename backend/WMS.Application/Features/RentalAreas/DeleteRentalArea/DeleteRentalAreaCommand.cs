using MediatR;

namespace WMS.Application.Features.RentalAreas.DeleteRentalArea;

public class DeleteRentalAreaCommand : IRequest<bool>
{
    public int Id { get; set; }
}
