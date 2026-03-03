using MediatR;
using WMS.Application.Features.RentalRequests.Common;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalRequests.GetRentalRequestById;

public class GetRentalRequestByIdHandler : IRequestHandler<GetRentalRequestByIdQuery, RentalRequestDto?>
{
    private readonly IRentalRequestRepository _repository;

    public GetRentalRequestByIdHandler(IRentalRequestRepository repository)
    {
        _repository = repository;
    }

    public async Task<RentalRequestDto?> Handle(GetRentalRequestByIdQuery request, CancellationToken cancellationToken)
    {
        var rentalRequest = await _repository.GetByIdAsync(request.Id);
        
        if (rentalRequest == null)
            return null;

        return new RentalRequestDto(
            rentalRequest.Id,
            rentalRequest.RenterId,
            rentalRequest.WarehouseId,
            rentalRequest.Warehouse.Name,
            rentalRequest.RequestedArea,
            rentalRequest.DurationMonths,
            rentalRequest.Status,
            rentalRequest.Notes,
            rentalRequest.CreatedAt,
            rentalRequest.ApprovedAt,
            rentalRequest.RejectedAt,
            rentalRequest.RejectionReason,
            rentalRequest.ReviewedBy
        );
    }
}
