using FluentValidation;

namespace WMS.Application.Features.RentalRequests.RejectRentalRequest;

public class RejectRentalRequestValidator : AbstractValidator<RejectRentalRequestCommand>
{
    public RejectRentalRequestValidator()
    {
        RuleFor(x => x.RequestId)
            .GreaterThan(0).WithMessage("RequestId must be valid");

        RuleFor(x => x.ReviewerId)
            .GreaterThan(0).WithMessage("ReviewerId must be valid");

        RuleFor(x => x.RejectionReason)
            .NotEmpty().WithMessage("Rejection reason is required")
            .MaximumLength(500).WithMessage("Rejection reason cannot exceed 500 characters");
    }
}
