using FluentValidation;

namespace WMS.Application.Features.EquipmentIncidents.ReportIncident;

public class ReportEquipmentIncidentValidator : AbstractValidator<ReportEquipmentIncidentCommand>
{
    public ReportEquipmentIncidentValidator()
    {
        RuleFor(x => x.EquipmentId)
            .GreaterThan(0).WithMessage("EquipmentId không hợp lệ");

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Tiêu đề không được để trống")
            .MaximumLength(200).WithMessage("Tiêu đề không được vượt quá 200 ký tự");

        RuleFor(x => x.Severity)
            .Must(s => new[] { "LOW", "MEDIUM", "HIGH", "CRITICAL" }.Contains(s))
            .WithMessage("Mức độ nghiêm trọng không hợp lệ");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Mô tả không được vượt quá 2000 ký tự");
    }
}
