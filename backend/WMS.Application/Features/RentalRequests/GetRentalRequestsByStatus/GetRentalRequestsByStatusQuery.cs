using MediatR;
using WMS.Application.Features.RentalRequests.Common;

namespace WMS.Application.Features.RentalRequests.GetRentalRequestsByStatus;

public record GetRentalRequestsByStatusQuery(string Status) : IRequest<IEnumerable<RentalRequestDto>>;
