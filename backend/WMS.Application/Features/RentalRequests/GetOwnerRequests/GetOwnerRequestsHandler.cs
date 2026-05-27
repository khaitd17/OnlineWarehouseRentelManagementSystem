using MediatR;
using WMS.Application.Features.RentalRequests.Common;
using WMS.Application.Interfaces;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalRequests.GetOwnerRequests;

public class GetOwnerRequestsHandler : IRequestHandler<GetOwnerRequestsQuery, IEnumerable<RentalRequestDto>>
{
    private readonly IRentalRequestRepository _repository;
    private readonly IWarehouseRepository _warehouseRepository;
    private readonly IUserRepository _userRepository;
    private readonly IRentalAreaRepository _rentalAreaRepository;

    public GetOwnerRequestsHandler(
        IRentalRequestRepository repository,
        IWarehouseRepository warehouseRepository,
        IUserRepository userRepository,
        IRentalAreaRepository rentalAreaRepository)
    {
        _repository = repository;
        _warehouseRepository = warehouseRepository;
        _userRepository = userRepository;
        _rentalAreaRepository = rentalAreaRepository;
    }

    public async Task<IEnumerable<RentalRequestDto>> Handle(GetOwnerRequestsQuery request, CancellationToken cancellationToken)
    {
        // Get all requests for owner's warehouses
        var allRequests = await _repository.GetByWarehouseOwnerIdAsync(request.OwnerId);

        // Filter by status if provided
        if (!string.IsNullOrEmpty(request.Status))
        {
            allRequests = allRequests.Where(r => r.Status == request.Status);
        }

        var result = new List<RentalRequestDto>();
        foreach (var r in allRequests)
        {
            var warehouse = await _warehouseRepository.GetByIdAsync(r.WarehouseId, cancellationToken);
            var renter = await _userRepository.GetByIdAsync(r.RenterId, cancellationToken);
            var owner = warehouse != null
                ? await _userRepository.GetByIdAsync(warehouse.OwnerId, cancellationToken)
                : null;
            // Rental area info
            string? rentalAreaName = null;
            double? rentalAreaSize = null;
            if (r.RentalAreaId.HasValue)
            {
                try { var a = await _rentalAreaRepository.GetByIdAsync(r.RentalAreaId.Value, cancellationToken); rentalAreaName = a?.Name; rentalAreaSize = a?.Size; } catch { }
            }

            result.Add(new RentalRequestDto
            {
                RequestId = r.RequestId,
                RenterId = r.RenterId,
                RenterName = renter?.FullName ?? "",
                RenterEmail = renter?.Email ?? "",
                RenterPhone = renter?.Phone ?? "",
                WarehouseId = r.WarehouseId,
                WarehouseName = warehouse?.Name ?? "",
                WarehouseAddress = warehouse?.Address ?? "",
                RequestedArea = r.RequestedArea,
                StartDate = r.StartDate,
                DurationMonths = r.DurationMonths,
                Status = r.Status,
                Notes = r.Notes,
                CreatedAt = r.CreatedAt ?? DateTime.UtcNow,
                ReviewedBy = r.ReviewedBy,
                ReviewedByName = null,
                ReviewedAt = r.ReviewedAt,
                RejectionReason = r.RejectionReason,
                ContractImageUrl = r.ContractImageUrl,
                OwnerName = owner?.FullName ?? "",
                OwnerEmail = owner?.Email ?? "",
                OwnerPhone = owner?.Phone ?? "",
                RentalAreaId = r.RentalAreaId,
                RentalAreaName = rentalAreaName,
                RentalAreaSize = rentalAreaSize,
                // Custom area
                IsCustomArea      = r.IsCustomArea,
                IsOwnerAssigned   = r.IsOwnerAssigned,
                ProposedPositionX = r.ProposedPositionX,
                ProposedPositionY = r.ProposedPositionY,
                ProposedWidth     = r.ProposedWidth,
                ProposedLength    = r.ProposedLength,
                BaseRentalAreaId  = r.BaseRentalAreaId,
                // Extension zone (L-shape)
                HasExtensionZone  = r.HasExtensionZone,
                ExtensionPositionX = r.ExtensionPositionX,
                ExtensionPositionY = r.ExtensionPositionY,
                ExtensionWidth    = r.ExtensionWidth,
                ExtensionLength   = r.ExtensionLength,
                // Multi-zone
                AdditionalZonesJson = r.AdditionalZonesJson,
                // Pricing for prioritization
                MonthlyPayment = warehouse?.PricePerM2 * (decimal)r.RequestedArea ?? 0,
                TotalValue = (warehouse?.PricePerM2 * (decimal)r.RequestedArea ?? 0) * r.DurationMonths
            });
        }
        return result;
    }
}
