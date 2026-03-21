using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalRequests.CancelRentalRequest;

public class CancelRentalRequestHandler : IRequestHandler<CancelRentalRequestCommand, Unit>
{
    private readonly IRentalRequestRepository _repository;

    public CancelRentalRequestHandler(IRentalRequestRepository repository)
    {
        _repository = repository;
    }

    public async Task<Unit> Handle(CancelRentalRequestCommand request, CancellationToken cancellationToken)
    {
        var rentalRequest = await _repository.GetByIdAsync(request.RequestId);
        if (rentalRequest == null)
            throw new InvalidOperationException("Rental request not found");

        if (rentalRequest.RenterId != request.RenterId)
            throw new UnauthorizedAccessException("Only the renter can cancel this request");

        rentalRequest.Cancel();
        await _repository.UpdateAsync(rentalRequest);

        return Unit.Value;
    }
}
