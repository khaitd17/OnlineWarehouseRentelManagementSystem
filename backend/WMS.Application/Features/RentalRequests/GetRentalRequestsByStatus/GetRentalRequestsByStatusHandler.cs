using MediatR;
using WMS.Application.Features.RentalRequests.Common;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalRequests.GetRentalRequestsByStatus;

public class GetRentalRequestsByStatusHandler : IRequestHandler<GetRentalRequestsByStatusQuery, IEnumerable<RentalRequestDto>>
{
    private readonly IRentalRequestRepository _repository;

    public GetRentalRequestsByStatusHandler(IRentalRequestRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<RentalRequestDto>> Handle(GetRentalRequestsByStatusQuery request, CancellationToken cancellationToken)
    {
        var rentalRequests = await _repository.GetByStatusAsync(request.Status);
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
