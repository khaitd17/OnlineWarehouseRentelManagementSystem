using FluentValidation;
using WMS.Application.Features.Returns.SubmitWarehouseReturn;
using WMS.Application.Features.Returns.UpdateInspection;
using WMS.Application.Features.ContractExtensions.RequestExtension;
using WMS.Application.Features.ContractExtensions.ReviewExtension;

namespace WMS.Application.Features.Validators
{
    public class SubmitWarehouseReturnValidator : AbstractValidator<SubmitWarehouseReturnCommand>
    {
        public SubmitWarehouseReturnValidator()
        {
            RuleFor(x => x.ContractId)
                .GreaterThan(0)
                .WithMessage("Contract ID must be greater than 0");

            RuleFor(x => x.RenterId)
                .GreaterThan(0)
                .WithMessage("Renter ID must be greater than 0");

            RuleFor(x => x.Notes)
                .MaximumLength(1000)
                .WithMessage("Notes cannot exceed 1000 characters");

            RuleForEach(x => x.Images)
                .SetValidator(new ReturnImageValidator());
        }
    }

    public class ReturnImageValidator : AbstractValidator<ReturnImageDto>
    {
        public ReturnImageValidator()
        {
            RuleFor(x => x.ImageUrl)
                .NotEmpty()
                .WithMessage("Image URL is required")
                .Must(BeValidUrl)
                .WithMessage("Image URL must be a valid URL");

            RuleFor(x => x.Description)
                .MaximumLength(500)
                .WithMessage("Image description cannot exceed 500 characters");
        }

        private bool BeValidUrl(string url)
        {
            return Uri.TryCreate(url, UriKind.Absolute, out _);
        }
    }

    public class UpdateInspectionValidator : AbstractValidator<UpdateInspectionCommand>
    {
        public UpdateInspectionValidator()
        {
            RuleFor(x => x.ReturnId)
                .GreaterThan(0)
                .WithMessage("Return ID must be greater than 0");

            RuleFor(x => x.InspectorId)
                .GreaterThan(0)
                .WithMessage("Inspector ID must be greater than 0");

            RuleFor(x => x.DamageFee)
                .GreaterThanOrEqualTo(0)
                .When(x => x.DamageFee.HasValue)
                .WithMessage("Damage fee must be non-negative");

            RuleFor(x => x.PenaltyFee)
                .GreaterThanOrEqualTo(0)
                .When(x => x.PenaltyFee.HasValue)
                .WithMessage("Penalty fee must be non-negative");

            RuleFor(x => x.Notes)
                .MaximumLength(1000)
                .WithMessage("Notes cannot exceed 1000 characters");
        }
    }

    public class RequestExtensionValidator : AbstractValidator<RequestExtensionCommand>
    {
        public RequestExtensionValidator()
        {
            RuleFor(x => x.OriginalContractId)
                .GreaterThan(0)
                .WithMessage("Original contract ID must be greater than 0");

            RuleFor(x => x.RequesterId)
                .GreaterThan(0)
                .WithMessage("Requester ID must be greater than 0");

            RuleFor(x => x.DurationMonths)
                .InclusiveBetween(1, 24)
                .WithMessage("Extension duration must be between 1 and 24 months");

            RuleFor(x => x.ProposedMonthlyPayment)
                .GreaterThan(0)
                .When(x => x.ProposedMonthlyPayment.HasValue)
                .WithMessage("Proposed monthly payment must be greater than 0");

            RuleFor(x => x.Notes)
                .MaximumLength(1000)
                .WithMessage("Notes cannot exceed 1000 characters");
        }
    }

    public class ReviewExtensionValidator : AbstractValidator<ReviewExtensionCommand>
    {
        public ReviewExtensionValidator()
        {
            RuleFor(x => x.ExtensionId)
                .GreaterThan(0)
                .WithMessage("Extension ID must be greater than 0");

            RuleFor(x => x.ReviewerId)
                .GreaterThan(0)
                .WithMessage("Reviewer ID must be greater than 0");

            RuleFor(x => x.Decision)
                .NotEmpty()
                .WithMessage("Decision is required")
                .Must(x => x.ToUpper() == "APPROVE" || x.ToUpper() == "REJECT")
                .WithMessage("Decision must be either APPROVE or REJECT");

            RuleFor(x => x.RejectionReason)
                .NotEmpty()
                .When(x => x.Decision?.ToUpper() == "REJECT")
                .WithMessage("Rejection reason is required when rejecting")
                .MaximumLength(1000)
                .WithMessage("Rejection reason cannot exceed 1000 characters");

            RuleFor(x => x.ApprovedMonthlyPayment)
                .GreaterThan(0)
                .When(x => x.Decision?.ToUpper() == "APPROVE" && x.ApprovedMonthlyPayment.HasValue)
                .WithMessage("Approved monthly payment must be greater than 0");
        }
    }
}