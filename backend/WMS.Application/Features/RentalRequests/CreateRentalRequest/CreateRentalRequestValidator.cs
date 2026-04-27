using FluentValidation;

namespace WMS.Application.Features.RentalRequests.CreateRentalRequest;

public class CreateRentalRequestValidator : AbstractValidator<CreateRentalRequestCommand>
{
    public CreateRentalRequestValidator()
    {
        RuleFor(x => x.RenterId)
            .GreaterThan(0).WithMessage("RenterId must be valid");

        RuleFor(x => x.WarehouseId)
            .GreaterThan(0).WithMessage("WarehouseId must be valid");

        RuleFor(x => x.RequestedArea)
            .GreaterThan(0).WithMessage("Requested area must be greater than 0");

        RuleFor(x => x.StartDate)
            .NotEmpty().WithMessage("Start date is required")
            .GreaterThanOrEqualTo(DateTime.Today).WithMessage("Start date must be in the future or today");

        RuleFor(x => x.DurationMonths)
            .GreaterThanOrEqualTo(1).WithMessage("Duration must be at least 1 month")
            .LessThanOrEqualTo(60).WithMessage("Duration cannot exceed 60 months");

        RuleFor(x => x.Notes)
            .MaximumLength(1000).WithMessage("Notes cannot exceed 1000 characters");
    }
}
