using MediatR;
using WMS.Application.Features.RentalRequests.Common;

namespace WMS.Application.Features.RentalRequests.GetMyRentalRequests;

public class GetMyRentalRequestsQuery : IRequest<IEnumerable<RentalRequestDto>>
{
    public int RenterId { get; set; }
}
