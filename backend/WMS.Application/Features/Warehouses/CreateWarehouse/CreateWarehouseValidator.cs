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
            .WithMessage("Diện tích sàn phải lớn hơn 0")
            .LessThanOrEqualTo(200_000)
            .WithMessage("Diện tích sàn không được vượt quá 200,000 m²");

        RuleFor(x => x.Height)
            .NotNull().WithMessage("Chiều cao kho không được để trống")
            .GreaterThan(0).When(x => x.Height.HasValue)
            .WithMessage("Chiều cao kho phải lớn hơn 0")
            .LessThanOrEqualTo(50).When(x => x.Height.HasValue)
            .WithMessage("Chiều cao kho không được vượt quá 50 m");

        RuleFor(x => x.Lat)
            .InclusiveBetween(-90, 90).When(x => x.Lat.HasValue)
            .WithMessage("Vĩ độ không hợp lệ (-90 đến 90)");

        RuleFor(x => x.Lng)
            .InclusiveBetween(-180, 180).When(x => x.Lng.HasValue)
            .WithMessage("Kinh độ không hợp lệ (-180 đến 180)");

        RuleFor(x => x)
            .Must(x => x.Is24HoursAccess || !x.OpenTime.HasValue || !x.CloseTime.HasValue || x.OpenTime < x.CloseTime)
            .WithMessage("Giờ mở cửa phải trước giờ đóng cửa");
    }
}