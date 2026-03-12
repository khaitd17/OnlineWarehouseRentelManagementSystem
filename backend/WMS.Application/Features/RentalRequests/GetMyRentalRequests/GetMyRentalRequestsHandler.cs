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

    public GetMyRentalRequestsHandler(
        IRentalRequestRepository repository,
        IWarehouseRepository warehouseRepository,
        IUserRepository userRepository)
    {
        _repository = repository;
        _warehouseRepository = warehouseRepository;
        _userRepository = userRepository;
    }

    public async Task<IEnumerable<RentalRequestDto>> Handle(GetMyRentalRequestsQuery request, CancellationToken cancellationToken)
    {
        var rentalRequests = await _repository.GetByRenterIdAsync(request.RenterId);

        var result = new List<RentalRequestDto>();
        foreach (var r in rentalRequests)
        {
            var warehouse = await _warehouseRepository.GetByIdAsync(r.WarehouseId, cancellationToken);
            var renter = await _userRepository.GetByIdAsync(r.RenterId, cancellationToken);
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
                ContractImageUrl = r.ContractImageUrl
            });
        }
        return result;
    }
}
