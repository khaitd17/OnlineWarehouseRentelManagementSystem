using FluentValidation;

namespace WMS.Application.Features.Warehouses.CreateWarehouse;

public class CreateWarehouseValidator : AbstractValidator<CreateWarehouseCommand>
{
    public CreateWarehouseValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.Address)
            .NotEmpty()
            .MaximumLength(500);

        RuleFor(x => x.TotalArea)
            .GreaterThan(0)
            .WithMessage("TotalArea must be greater than 0");

        RuleFor(x => x.OperatingHours)
            .MaximumLength(200)
            .When(x => !string.IsNullOrEmpty(x.OperatingHours));
    }
}