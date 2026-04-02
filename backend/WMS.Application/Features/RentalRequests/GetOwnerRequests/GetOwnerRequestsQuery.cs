using MediatR;
using WMS.Application.Features.RentalRequests.Common;

namespace WMS.Application.Features.RentalRequests.GetOwnerRequests;

public class GetOwnerRequestsQuery : IRequest<IEnumerable<RentalRequestDto>>
{
    public int OwnerId { get; set; }
    public string? Status { get; set; } // Optional filter: PENDING, APPROVED, REJECTED, etc.
}
