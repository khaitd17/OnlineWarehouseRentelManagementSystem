using FluentValidation;

namespace WMS.Application.Features.Admin.ApproveWarehouse;

public class ApproveWarehouseValidator : AbstractValidator<ApproveWarehouseCommand>
{
    public ApproveWarehouseValidator()
    {
        RuleFor(x => x.WarehouseId)
            .NotEmpty().WithMessage("ID kho không được để trống.")
            .GreaterThan(0).WithMessage("ID kho không hợp lệ.");

        RuleFor(x => x.RejectionReason)
            .NotEmpty()
            .When(x => !x.IsApproved)
            .WithMessage("Vui lòng cung cấp lý do từ chối.")
            .MaximumLength(500).WithMessage("Lý do từ chối không được vượt quá 500 ký tự.");
    }
}
