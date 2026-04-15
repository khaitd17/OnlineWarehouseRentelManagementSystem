using FluentValidation;

namespace WMS.Application.Features.Equipments.UpdateEquipment;

public class UpdateEquipmentValidator : AbstractValidator<UpdateEquipmentCommand>
{
    public UpdateEquipmentValidator()
    {
        RuleFor(x => x.EquipmentId)
            .GreaterThan(0).WithMessage("EquipmentId không hợp lệ");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên thiết bị không được để trống")
            .MaximumLength(100).WithMessage("Tên thiết bị không được vượt quá 100 ký tự");

        RuleFor(x => x.Type)
            .MaximumLength(50).WithMessage("Loại thiết bị không được vượt quá 50 ký tự")
            .Must(t => new[] { "Camera", "Forklift", "Sensor", "Gate", "Lighting", "HVAC", "FireAlarm", "Other", null }.Contains(t))
            .WithMessage("Loại thiết bị không hợp lệ")
            .When(x => !string.IsNullOrEmpty(x.Type));

        RuleFor(x => x.SerialNumber)
            .MaximumLength(100).WithMessage("Số seri không được vượt quá 100 ký tự");

        RuleFor(x => x.Location)
            .MaximumLength(255).WithMessage("Vị trí không được vượt quá 255 ký tự");

        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Mô tả không được vượt quá 1000 ký tự");

        RuleFor(x => x.Specifications)
            .MaximumLength(1000).WithMessage("Thông số kỹ thuật không được vượt quá 1000 ký tự");

        RuleFor(x => x.MaintenanceCycleDays)
            .InclusiveBetween(1, 3650).WithMessage("Chu kỳ bảo trì phải từ 1 đến 3650 ngày")
            .When(x => x.MaintenanceCycleDays.HasValue);

        RuleFor(x => x.IotDeviceId)
            .MaximumLength(100).WithMessage("IoT Device ID không được vượt quá 100 ký tự");
    }
}
