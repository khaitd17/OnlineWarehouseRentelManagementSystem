using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalRequests.ApproveRentalRequest;

public class ApproveRentalRequestHandler : IRequestHandler<ApproveRentalRequestCommand, bool>
{
    private readonly IRentalRequestRepository _repository;

    public ApproveRentalRequestHandler(IRentalRequestRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> Handle(ApproveRentalRequestCommand request, CancellationToken cancellationToken)
    {
        var rentalRequest = await _repository.GetByIdAsync(request.RentalRequestId);
        
        if (rentalRequest == null)
            return false;

        rentalRequest.Approve(request.ReviewerId);
        await _repository.UpdateAsync(rentalRequest);
        
        return true;
    }
}
