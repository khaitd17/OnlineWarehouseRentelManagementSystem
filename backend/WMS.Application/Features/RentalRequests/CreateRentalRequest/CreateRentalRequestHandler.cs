using MediatR;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalRequests.CreateRentalRequest;

public class CreateRentalRequestHandler : IRequestHandler<CreateRentalRequestCommand, int>
{
    private readonly IRentalRequestRepository _repository;
    private readonly IWarehouseRepository _warehouseRepository;

    public CreateRentalRequestHandler(
        IRentalRequestRepository repository,
        IWarehouseRepository warehouseRepository)
    {
        _repository = repository;
        _warehouseRepository = warehouseRepository;
    }

    public async Task<int> Handle(CreateRentalRequestCommand request, CancellationToken cancellationToken)
    {
        // Validate warehouse exists
        var warehouse = await _warehouseRepository.GetByIdAsync(request.WarehouseId);
        if (warehouse == null)
            throw new InvalidOperationException($"Warehouse with ID {request.WarehouseId} not found.");

        // Validate requested area
        if (request.RequestedArea <= 0)
            throw new ArgumentException("Requested area must be greater than 0.");

        if (request.RequestedArea > warehouse.Area)
            throw new InvalidOperationException($"Requested area ({request.RequestedArea}) exceeds warehouse capacity ({warehouse.Area}).");

        // Validate duration
        if (request.DurationMonths <= 0)
            throw new ArgumentException("Duration must be at least 1 month.");

        var rentalRequest = new RentalRequest(
            request.RenterId,
            request.WarehouseId,
            request.RequestedArea,
            request.DurationMonths,
            request.Notes
        );

        return await _repository.AddAsync(rentalRequest);
    }
}
