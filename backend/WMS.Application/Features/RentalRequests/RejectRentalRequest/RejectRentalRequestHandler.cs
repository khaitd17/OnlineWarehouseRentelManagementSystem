using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalRequests.RejectRentalRequest;

public class RejectRentalRequestHandler : IRequestHandler<RejectRentalRequestCommand, bool>
{
    private readonly IRentalRequestRepository _repository;

    public RejectRentalRequestHandler(IRentalRequestRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> Handle(RejectRentalRequestCommand request, CancellationToken cancellationToken)
    {
        var rentalRequest = await _repository.GetByIdAsync(request.RentalRequestId);
        
        if (rentalRequest == null)
            return false;

        rentalRequest.Reject(request.ReviewerId, request.RejectionReason);
        await _repository.UpdateAsync(rentalRequest);
        
        return true;
    }
}
