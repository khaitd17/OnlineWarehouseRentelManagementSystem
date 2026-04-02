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

    public GetOwnerRequestsHandler(
        IRentalRequestRepository repository,
        IWarehouseRepository warehouseRepository,
        IUserRepository userRepository)
    {
        _repository = repository;
        _warehouseRepository = warehouseRepository;
        _userRepository = userRepository;
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
                OwnerName = owner?.FullName ?? "",
                OwnerEmail = owner?.Email ?? "",
                OwnerPhone = owner?.Phone ?? ""
            });
        }
        return result;
    }
}
