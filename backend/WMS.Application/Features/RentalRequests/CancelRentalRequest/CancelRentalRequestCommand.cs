using MediatR;

namespace WMS.Application.Features.RentalRequests.CancelRentalRequest;

public class CancelRentalRequestCommand : IRequest<Unit>
{
    public int RequestId { get; set; }
    public int RenterId { get; set; }
    public string? CancellationReason { get; set; } // NEW - Optional reason
}
