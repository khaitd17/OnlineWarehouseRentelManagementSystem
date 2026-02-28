using FluentValidation;
using WMS.Domain.Constants;

namespace WMS.Application.Features.Admin.Commands.UpdateWarehouse;

public class UpdateWarehouseCommandValidator : AbstractValidator<UpdateWarehouseCommand>
{
    public UpdateWarehouseCommandValidator()
    {
        RuleFor(v => v.WarehouseId).GreaterThan(0);
        RuleFor(v => v.Name).NotEmpty().MaximumLength(255);
        RuleFor(v => v.Address).NotEmpty();
        RuleFor(v => v.TotalArea).GreaterThan(0);
        RuleFor(v => v.AvailableArea).GreaterThanOrEqualTo(0);
        RuleFor(v => v.OwnerId).GreaterThan(0);
        RuleFor(v => v.Status).NotEmpty().Must(WarehouseStatus.IsValid)
            .WithMessage("Invalid Warehouse Status");
    }
}
