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
        RuleFor(x => x.Status)
            .Must(s => new[] { "DRAFT", "HIDDEN", null }.Contains(s))
            .WithMessage("Status phải là DRAFT hoặc HIDDEN khi tạo mới");

        // Field limits
        RuleFor(x => x.Width)
            .InclusiveBetween(1, 10000).When(x => x.Width.HasValue)
            .WithMessage("Chiều rộng không hợp lệ (1 - 10,000)");

        RuleFor(x => x.Length)
            .InclusiveBetween(1, 10000).When(x => x.Length.HasValue)
            .WithMessage("Chiều dài không hợp lệ (1 - 10,000)");

        RuleFor(x => x.PricePerM2)
            .InclusiveBetween(1000, 10000000).When(x => x.PricePerM2.HasValue)
            .WithMessage("Giá mỗi m2 không hợp lệ (1,000 - 10,000,000)");

        RuleFor(x => x.Lat)
            .InclusiveBetween(-90, 90).When(x => x.Lat.HasValue)
            .WithMessage("Vĩ độ không hợp lệ (-90 đến 90)");

        RuleFor(x => x.Lng)
            .InclusiveBetween(-180, 180).When(x => x.Lng.HasValue)
            .WithMessage("Kinh độ không hợp lệ (-180 đến 180)");

        // Cross-field validations
        RuleFor(x => x)
            .Must(x => !x.Width.HasValue || !x.Length.HasValue ||
                       Math.Abs(x.TotalArea - (x.Width.Value * x.Length.Value)) < 0.01)
            .WithMessage("TotalArea phải bằng Width × Length");

        RuleFor(x => x)
            .Must(x => x.Is24HoursAccess || !x.OpenTime.HasValue || !x.CloseTime.HasValue || x.OpenTime < x.CloseTime)
            .WithMessage("Giờ mở cửa phải trước giờ đóng cửa");
    }
}