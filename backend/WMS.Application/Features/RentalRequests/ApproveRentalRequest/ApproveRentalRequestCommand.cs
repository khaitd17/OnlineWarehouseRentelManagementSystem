using MediatR;

namespace WMS.Application.Features.RentalRequests.ApproveRentalRequest;

public record ApproveRentalRequestCommand(
    int RentalRequestId,
    int ReviewerId
) : IRequest<bool>;
