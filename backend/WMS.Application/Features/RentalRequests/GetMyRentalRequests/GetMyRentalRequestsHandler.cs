using MediatR;
using WMS.Application.Features.RentalRequests.Common;
using WMS.Application.Interfaces;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalRequests.GetMyRentalRequests;

public class GetMyRentalRequestsHandler : IRequestHandler<GetMyRentalRequestsQuery, IEnumerable<RentalRequestDto>>
{
    private readonly IRentalRequestRepository _repository;
    private readonly IWarehouseRepository _warehouseRepository;
    private readonly IUserRepository _userRepository;
    private readonly IRentalContractRepository _contractRepository;
    private readonly IRentalAreaRepository _rentalAreaRepository;

    public GetMyRentalRequestsHandler(
        IRentalRequestRepository repository,
        IWarehouseRepository warehouseRepository,
        IUserRepository userRepository,
        IRentalContractRepository contractRepository,
        IRentalAreaRepository rentalAreaRepository)
    {
        _repository = repository;
        _warehouseRepository = warehouseRepository;
        _userRepository = userRepository;
        _contractRepository = contractRepository;
        _rentalAreaRepository = rentalAreaRepository;
    }

    public async Task<IEnumerable<RentalRequestDto>> Handle(GetMyRentalRequestsQuery request, CancellationToken cancellationToken)
    {
        var rentalRequests = await _repository.GetByRenterIdAsync(request.RenterId);

        var result = new List<RentalRequestDto>();
        foreach (var r in rentalRequests)
        {
            var warehouse = await _warehouseRepository.GetByIdAsync(r.WarehouseId, cancellationToken);
            var renter = await _userRepository.GetByIdAsync(r.RenterId, cancellationToken);

            // Get contract ID and status if request is approved
            int? contractId = null;
            string? contractStatus = null;
            if (r.Status == "APPROVED")
            {
                var contract = await _contractRepository.GetByRentalRequestIdAsync(r.RequestId);
                if (contract != null)
                {
                    contractId = contract.ContractId;
                    contractStatus = contract.Status;
                }
            }

            // Get rental area info if selected
            string? rentalAreaName = null;
            double? rentalAreaSize = null;
            if (r.RentalAreaId.HasValue)
            {
                var area = await _rentalAreaRepository.GetByIdAsync(r.RentalAreaId.Value, cancellationToken);
                rentalAreaName = area?.Name;
                rentalAreaSize = area?.Size;
            }

            result.Add(new RentalRequestDto
            {
                RequestId = r.RequestId,
                RenterId = r.RenterId,
                RenterName = renter?.FullName ?? "",
                RenterEmail = renter?.Email ?? "",
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
                ContractId = contractId,
                ContractStatus = contractStatus,
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
            });
        }
        return result;
    }
}
