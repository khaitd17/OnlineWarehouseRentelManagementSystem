using MediatR;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalRequests.ApproveRentalRequest;

public class ApproveRentalRequestHandler : IRequestHandler<ApproveRentalRequestCommand, int>
{
    private readonly IRentalRequestRepository _rentalRequestRepository;
   // private readonly IRentalContractRepository _contractRepository;
    private readonly IWarehouseRepository _warehouseRepository;

    public ApproveRentalRequestHandler(
        IRentalRequestRepository rentalRequestRepository,
        //IRentalContractRepository contractRepository,
        IWarehouseRepository warehouseRepository)
    {
        _rentalRequestRepository = rentalRequestRepository;
        //_contractRepository = contractRepository;
        _warehouseRepository = warehouseRepository;
    }

    public async Task<int> Handle(ApproveRentalRequestCommand request, CancellationToken cancellationToken)
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
            throw new UnauthorizedAccessException("Only warehouse owner can approve requests");

        // Check warehouse still has enough available area
        if (warehouse.AvailableArea < rentalRequest.RequestedArea)
            throw new InvalidOperationException("Warehouse no longer has enough available area");

        // Approve rental request (domain method)
        rentalRequest.Approve(request.ReviewerId, request.ContractImageUrl);
        await _rentalRequestRepository.UpdateAsync(rentalRequest);

        // Create rental contract - TEMPORARILY DISABLED FOR TESTING
        /*
        var contract = RentalContract.CreateFromRequest(
            rentalRequest,
            request.MonthlyPayment,
            request.DepositAmount,
            request.Terms
        );

        var contractId = await _contractRepository.AddAsync(contract);
        */

        // TODO: Send notification to renter

        return rentalRequest.RequestId; // Return request ID instead of contract ID for now
    }
}
