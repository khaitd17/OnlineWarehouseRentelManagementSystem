using MediatR;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalRequests.CreateRentalRequest;

public class CreateRentalRequestHandler : IRequestHandler<CreateRentalRequestCommand, int>
{
    private readonly IRentalRequestRepository _rentalRequestRepository;
    private readonly IWarehouseRepository _warehouseRepository;

    public CreateRentalRequestHandler(
        IRentalRequestRepository rentalRequestRepository,
        IWarehouseRepository warehouseRepository)
    {
        _rentalRequestRepository = rentalRequestRepository;
        _warehouseRepository = warehouseRepository;
    }

    public async Task<int> Handle(CreateRentalRequestCommand request, CancellationToken cancellationToken)
    {
        // Validate warehouse exists and has enough available area
        var warehouse = await _warehouseRepository.GetByIdAsync(request.WarehouseId, cancellationToken);
        if (warehouse == null)
            throw new InvalidOperationException("Warehouse not found");

        if (warehouse.Status != "APPROVED")
            throw new InvalidOperationException("Warehouse is not available for rental");

        if (warehouse.AvailableArea < request.RequestedArea)
            throw new InvalidOperationException($"Warehouse does not have enough available area. Available: {warehouse.AvailableArea}, Requested: {request.RequestedArea}");

        // Check if user already has pending request for this warehouse
        var hasPending = await _rentalRequestRepository.HasPendingRequestAsync(request.RenterId, request.WarehouseId);
        if (hasPending)
            throw new InvalidOperationException("You already have a pending request for this warehouse");

        // Create rental request
        var rentalRequest = RentalRequest.Create(
            request.RenterId,
            request.WarehouseId,
            request.RequestedArea,
            request.StartDate,
            request.DurationMonths,
            request.Notes
        );

        var requestId = await _rentalRequestRepository.AddAsync(rentalRequest);

        return requestId;
    }
}
