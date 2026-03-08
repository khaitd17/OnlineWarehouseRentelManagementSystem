using MediatR;

namespace WMS.Application.Features.RentalRequests.ApproveRentalRequest;

public class ApproveRentalRequestCommand : IRequest<int>
{
    public int RequestId { get; set; }
    public int ReviewerId { get; set; }
    public string? ContractImageUrl { get; set; }
}
