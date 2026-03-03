using MediatR;

namespace WMS.Application.Features.RentalRequests.RejectRentalRequest;

public record RejectRentalRequestCommand(
    int RentalRequestId,
    int ReviewerId,
    string RejectionReason
) : IRequest<bool>;
