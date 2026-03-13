using MediatR;
using WMS.Application.Features.RentalRequests.Common;
using WMS.Application.Interfaces;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalRequests.GetRentalRequestById;

public class GetRentalRequestByIdHandler : IRequestHandler<GetRentalRequestByIdQuery, RentalRequestDto?>
{
    private readonly IRentalRequestRepository _repository;
    private readonly IWarehouseRepository _warehouseRepository;
    private readonly IUserRepository _userRepository;

    public GetRentalRequestByIdHandler(
        IRentalRequestRepository repository,
        IWarehouseRepository warehouseRepository,
        IUserRepository userRepository)
    {
        _repository = repository;
        _warehouseRepository = warehouseRepository;
        _userRepository = userRepository;
    }

    public async Task<RentalRequestDto?> Handle(GetRentalRequestByIdQuery request, CancellationToken cancellationToken)
    {
        var rentalRequest = await _repository.GetByIdAsync(request.RequestId);
        if (rentalRequest == null)
            return null;

        var warehouse = await _warehouseRepository.GetByIdAsync(rentalRequest.WarehouseId, cancellationToken);
        var renter = await _userRepository.GetByIdAsync(rentalRequest.RenterId, cancellationToken);

        return new RentalRequestDto
        {
            RequestId = rentalRequest.RequestId,
            RenterId = rentalRequest.RenterId,
            RenterName = renter?.FullName ?? "",
            RenterEmail = renter?.Email ?? "",
            WarehouseId = rentalRequest.WarehouseId,
            WarehouseName = warehouse?.Name ?? "",
            WarehouseAddress = warehouse?.Address ?? "",
            RequestedArea = rentalRequest.RequestedArea,
            StartDate = rentalRequest.StartDate,
            DurationMonths = rentalRequest.DurationMonths,
            Status = rentalRequest.Status,
            Notes = rentalRequest.Notes,
            CreatedAt = rentalRequest.CreatedAt ?? DateTime.UtcNow,
            ReviewedBy = rentalRequest.ReviewedBy,
            ReviewedByName = null,
            ReviewedAt = rentalRequest.ReviewedAt,
            RejectionReason = rentalRequest.RejectionReason,
            ContractImageUrl = rentalRequest.ContractImageUrl
        };
    }
}
