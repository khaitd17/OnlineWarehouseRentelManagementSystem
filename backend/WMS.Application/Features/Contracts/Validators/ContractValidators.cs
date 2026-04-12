using FluentValidation;
using WMS.Application.Features.Contracts.CancelContract;
using WMS.Application.Features.Contracts.TerminateEarly;
using WMS.Application.Features.Contracts.CloseContract;

namespace WMS.Application.Features.Contracts.Validators
{
    public class CancelContractValidator : AbstractValidator<CancelContractCommand>
    {
        public CancelContractValidator()
        {
            RuleFor(x => x.ContractId)
                .GreaterThan(0)
                .WithMessage("Contract ID must be greater than 0");

            RuleFor(x => x.CancellationReason)
                .NotEmpty()
                .WithMessage("Cancellation reason is required")
                .MinimumLength(10)
                .WithMessage("Cancellation reason must be at least 10 characters")
                .MaximumLength(1000)
                .WithMessage("Cancellation reason cannot exceed 1000 characters");

            RuleFor(x => x.UserId)
                .GreaterThan(0)
                .WithMessage("User ID must be greater than 0");
        }
    }

    public class TerminateEarlyValidator : AbstractValidator<TerminateEarlyCommand>
    {
        public TerminateEarlyValidator()
        {
            RuleFor(x => x.ContractId)
                .GreaterThan(0)
                .WithMessage("Contract ID must be greater than 0");

            RuleFor(x => x.TerminationReason)
                .NotEmpty()
                .WithMessage("Termination reason is required")
                .MinimumLength(10)
                .WithMessage("Termination reason must be at least 10 characters");

            RuleFor(x => x.UserId)
                .GreaterThan(0)
                .WithMessage("User ID must be greater than 0");
        }
    }

    public class CloseContractValidator : AbstractValidator<CloseContractCommand>
    {
        public CloseContractValidator()
        {
            RuleFor(x => x.ContractId)
                .GreaterThan(0)
                .WithMessage("Contract ID must be greater than 0");

            RuleFor(x => x.DamageCompensation)
                .GreaterThanOrEqualTo(0)
                .When(x => x.DamageCompensation.HasValue)
                .WithMessage("Damage compensation must be non-negative");

            RuleFor(x => x.Notes)
                .MaximumLength(1000)
                .WithMessage("Notes cannot exceed 1000 characters");

            RuleFor(x => x.UserId)
                .GreaterThan(0)
                .WithMessage("User ID must be greater than 0");
        }
    }
}