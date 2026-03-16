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

        RuleFor(x => x.MonthlyPayment)
            .GreaterThan(0).WithMessage("Monthly payment must be greater than 0");

        RuleFor(x => x.DepositAmount)
            .GreaterThanOrEqualTo(0).When(x => x.DepositAmount.HasValue)
            .WithMessage("Deposit amount must be non-negative");

        RuleFor(x => x.Terms)
            .MaximumLength(2000).When(x => x.Terms != null)
            .WithMessage("Terms must not exceed 2000 characters");
    }
}
