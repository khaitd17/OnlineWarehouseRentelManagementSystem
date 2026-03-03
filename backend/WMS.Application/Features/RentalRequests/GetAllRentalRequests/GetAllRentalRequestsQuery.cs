using MediatR;
using WMS.Application.Features.RentalRequests.Common;

namespace WMS.Application.Features.RentalRequests.GetAllRentalRequests;

public record GetAllRentalRequestsQuery : IRequest<IEnumerable<RentalRequestDto>>;
