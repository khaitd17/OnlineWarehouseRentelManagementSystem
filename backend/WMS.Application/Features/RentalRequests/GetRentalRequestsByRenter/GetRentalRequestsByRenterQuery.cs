using MediatR;
using WMS.Application.Features.RentalRequests.Common;

namespace WMS.Application.Features.RentalRequests.GetRentalRequestsByRenter;

public record GetRentalRequestsByRenterQuery(int RenterId) : IRequest<IEnumerable<RentalRequestDto>>;
