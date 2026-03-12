using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalRequests.SendRentalRequest;

public class SendRentalRequestHandler : IRequestHandler<SendRentalRequestCommand, Unit>
{
    private readonly IRentalRequestRepository _repository;

    public SendRentalRequestHandler(IRentalRequestRepository repository)
    {
        _repository = repository;
    }

    public async Task<Unit> Handle(SendRentalRequestCommand request, CancellationToken cancellationToken)
    {
        var rentalRequest = await _repository.GetByIdAsync(request.RequestId);
        if (rentalRequest == null)
            throw new InvalidOperationException("Rental request not found");

        if (rentalRequest.RenterId != request.RenterId)
            throw new UnauthorizedAccessException("Only the renter can send this request");

        rentalRequest.Send();
        await _repository.UpdateAsync(rentalRequest);

        return Unit.Value;
    }
}
