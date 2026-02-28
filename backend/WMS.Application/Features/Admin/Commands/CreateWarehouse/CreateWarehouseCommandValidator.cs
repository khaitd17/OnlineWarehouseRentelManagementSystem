using FluentValidation;

namespace WMS.Application.Features.Admin.Commands.CreateWarehouse;

public class CreateWarehouseCommandValidator : AbstractValidator<CreateWarehouseCommand>
{
    public CreateWarehouseCommandValidator()
    {
        RuleFor(v => v.Name).NotEmpty().MaximumLength(255);
        RuleFor(v => v.Address).NotEmpty();
        RuleFor(v => v.TotalArea).GreaterThan(0);
        RuleFor(v => v.AvailableArea).GreaterThanOrEqualTo(0);
        RuleFor(v => v.OwnerId).GreaterThan(0);
    }
}
