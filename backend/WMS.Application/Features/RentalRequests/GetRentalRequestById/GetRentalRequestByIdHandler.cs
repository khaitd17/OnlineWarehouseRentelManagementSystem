using MediatR;
using WMS.Application.Features.RentalRequests.Common;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalRequests.GetRentalRequestById;

public class GetRentalRequestByIdHandler : IRequestHandler<GetRentalRequestByIdQuery, RentalRequestDto?>
{
    private readonly IRentalRequestRepository _repository;
    private readonly IWarehouseRepository _warehouseRepository;

    public GetRentalRequestByIdHandler(
        IRentalRequestRepository repository,
        IWarehouseRepository warehouseRepository)
    {
        _repository = repository;
        _warehouseRepository = warehouseRepository;
    }

    public async Task<RentalRequestDto?> Handle(GetRentalRequestByIdQuery request, CancellationToken cancellationToken)
    {
        var rentalRequest = await _repository.GetByIdAsync(request.RequestId);
        if (rentalRequest == null)
            return null;

        // For now, return basic DTO without related data
        // In production, you'd join with warehouse and user data
        return new RentalRequestDto
        {
            RequestId = rentalRequest.RequestId,
            RenterId = rentalRequest.RenterId,
            RenterName = "", // TODO: Get from user repository
            RenterEmail = "", // TODO: Get from user repository
            WarehouseId = rentalRequest.WarehouseId,
            WarehouseName = "", // TODO: Get from warehouse
            WarehouseAddress = "", // TODO: Get from warehouse
            RequestedArea = rentalRequest.RequestedArea,
            StartDate = rentalRequest.StartDate,
            DurationMonths = rentalRequest.DurationMonths,
            Status = rentalRequest.Status,
            Notes = rentalRequest.Notes,
            CreatedAt = rentalRequest.CreatedAt,
            ReviewedBy = rentalRequest.ReviewedBy,
            ReviewedByName = null, // TODO: Get from user repository
            ReviewedAt = rentalRequest.ReviewedAt,
            RejectionReason = rentalRequest.RejectionReason,
            ContractImageUrl = rentalRequest.ContractImageUrl
        };
    }
}
