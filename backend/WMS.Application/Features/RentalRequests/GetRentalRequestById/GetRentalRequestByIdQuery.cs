using MediatR;
using WMS.Application.Features.RentalRequests.Common;

namespace WMS.Application.Features.RentalRequests.GetRentalRequestById;

public record GetRentalRequestByIdQuery(int Id) : IRequest<RentalRequestDto?>;
