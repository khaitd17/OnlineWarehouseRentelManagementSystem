using MediatR;

namespace WMS.Application.Features.RentalRequests.RejectRentalRequest;

public class RejectRentalRequestCommand : IRequest<Unit>
{
    public int RequestId { get; set; }
    public int ReviewerId { get; set; }
    public string RejectionReason { get; set; } = null!;
}
