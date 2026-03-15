using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalAreas.DeleteRentalArea;

public class DeleteRentalAreaHandler : IRequestHandler<DeleteRentalAreaCommand, bool>
{
    private readonly IRentalAreaRepository _rentalAreaRepository;

    public DeleteRentalAreaHandler(IRentalAreaRepository rentalAreaRepository)
    {
        _rentalAreaRepository = rentalAreaRepository;
    }

    public async Task<bool> Handle(DeleteRentalAreaCommand request, CancellationToken cancellationToken)
    {
        var rentalArea = await _rentalAreaRepository.GetByIdAsync(request.Id, cancellationToken);
        if (rentalArea == null)
        {
            throw new Exception("Rental area not found");
        }

        await _rentalAreaRepository.DeleteAsync(rentalArea, cancellationToken);
        
        return true;
    }
}
