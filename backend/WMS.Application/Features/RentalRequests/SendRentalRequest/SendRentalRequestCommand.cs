using MediatR;

namespace WMS.Application.Features.RentalRequests.SendRentalRequest;

public class SendRentalRequestCommand : IRequest<Unit>
{
    public int RequestId { get; set; }
    public int RenterId { get; set; }
}
