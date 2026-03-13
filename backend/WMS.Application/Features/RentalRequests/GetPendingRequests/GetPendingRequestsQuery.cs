using MediatR;
using WMS.Application.Features.RentalRequests.Common;

namespace WMS.Application.Features.RentalRequests.GetPendingRequests;

public class GetPendingRequestsQuery : IRequest<IEnumerable<RentalRequestDto>>
{
    public int OwnerId { get; set; }
}
