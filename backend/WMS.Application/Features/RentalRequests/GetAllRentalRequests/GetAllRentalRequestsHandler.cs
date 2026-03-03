using MediatR;
using WMS.Application.Features.RentalRequests.Common;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalRequests.GetAllRentalRequests;

public class GetAllRentalRequestsHandler : IRequestHandler<GetAllRentalRequestsQuery, IEnumerable<RentalRequestDto>>
{
    private readonly IRentalRequestRepository _repository;

    public GetAllRentalRequestsHandler(IRentalRequestRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<RentalRequestDto>> Handle(GetAllRentalRequestsQuery request, CancellationToken cancellationToken)
    {
        var rentalRequests = await _repository.GetAllAsync();
        return rentalRequests.Select(r => new RentalRequestDto(
            r.Id,
            r.RenterId,
            r.WarehouseId,
            r.Warehouse.Name,
            r.RequestedArea,
            r.DurationMonths,
            r.Status,
            r.Notes,
            r.CreatedAt,
            r.ApprovedAt,
            r.RejectedAt,
            r.RejectionReason,
            r.ReviewedBy
        ));
    }
}
