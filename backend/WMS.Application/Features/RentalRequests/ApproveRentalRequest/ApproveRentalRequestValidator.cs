using FluentValidation;

namespace WMS.Application.Features.RentalRequests.ApproveRentalRequest;

public class ApproveRentalRequestValidator : AbstractValidator<ApproveRentalRequestCommand>
{
    public ApproveRentalRequestValidator()
    {
        RuleFor(x => x.RequestId)
            .GreaterThan(0).WithMessage("RequestId must be valid");

        RuleFor(x => x.ReviewerId)
            .GreaterThan(0).WithMessage("ReviewerId must be valid");

        RuleFor(x => x.ContractImageUrl)
            .MaximumLength(500).WithMessage("Contract image URL must not exceed 500 characters");
    }
}
