using MediatR;
using WMS.Application.Features.RentalRequests.Common;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalRequests.GetMyRentalRequests;

public class GetMyRentalRequestsHandler : IRequestHandler<GetMyRentalRequestsQuery, IEnumerable<RentalRequestDto>>
{
    private readonly IRentalRequestRepository _repository;

    public GetMyRentalRequestsHandler(IRentalRequestRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<RentalRequestDto>> Handle(GetMyRentalRequestsQuery request, CancellationToken cancellationToken)
    {
        var rentalRequests = await _repository.GetByRenterIdAsync(request.RenterId);

        return rentalRequests.Select(r => new RentalRequestDto
        {
            RequestId = r.RequestId,
            RenterId = r.RenterId,
            RenterName = "", // TODO: Populate from user data
            RenterEmail = "",
            WarehouseId = r.WarehouseId,
            WarehouseName = "", // TODO: Populate from warehouse data
            WarehouseAddress = "",
            RequestedArea = r.RequestedArea,
            StartDate = r.StartDate,
            DurationMonths = r.DurationMonths,
            Status = r.Status,
            Notes = r.Notes,
            CreatedAt = r.CreatedAt,
            ReviewedBy = r.ReviewedBy,
            ReviewedByName = null,
            ReviewedAt = r.ReviewedAt,
            RejectionReason = r.RejectionReason,
            ContractImageUrl = r.ContractImageUrl
        }).ToList();
    }
}
