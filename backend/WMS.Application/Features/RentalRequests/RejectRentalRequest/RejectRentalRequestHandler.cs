using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalRequests.RejectRentalRequest;

public class RejectRentalRequestHandler : IRequestHandler<RejectRentalRequestCommand, Unit>
{
    private readonly IRentalRequestRepository _rentalRequestRepository;
    private readonly IWarehouseRepository _warehouseRepository;

    public RejectRentalRequestHandler(
        IRentalRequestRepository rentalRequestRepository,
        IWarehouseRepository warehouseRepository)
    {
        _rentalRequestRepository = rentalRequestRepository;
        _warehouseRepository = warehouseRepository;
    }

    public async Task<Unit> Handle(RejectRentalRequestCommand request, CancellationToken cancellationToken)
    {
        // Get rental request
        var rentalRequest = await _rentalRequestRepository.GetByIdAsync(request.RequestId);
        if (rentalRequest == null)
            throw new InvalidOperationException("Rental request not found");

        // Verify reviewer is the warehouse owner
        var warehouse = await _warehouseRepository.GetByIdAsync(rentalRequest.WarehouseId, cancellationToken);
        if (warehouse == null)
            throw new InvalidOperationException("Warehouse not found");

        if (warehouse.OwnerId != request.ReviewerId)
            throw new UnauthorizedAccessException("Only warehouse owner can reject requests");

        // Reject rental request (domain method)
        rentalRequest.Reject(request.ReviewerId, request.RejectionReason);
        await _rentalRequestRepository.UpdateAsync(rentalRequest);

        // TODO: Send notification to renter

        return Unit.Value;
    }
}
