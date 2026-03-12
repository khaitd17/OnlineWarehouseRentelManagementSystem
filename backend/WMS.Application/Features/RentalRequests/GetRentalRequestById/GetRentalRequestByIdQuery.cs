using MediatR;
using WMS.Application.Features.RentalRequests.Common;

namespace WMS.Application.Features.RentalRequests.GetRentalRequestById;

public class GetRentalRequestByIdQuery : IRequest<RentalRequestDto?>
{
    public int RequestId { get; set; }
    public int UserId { get; set; } // For authorization check
}
