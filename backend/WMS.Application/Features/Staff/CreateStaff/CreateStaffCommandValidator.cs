using FluentValidation;

namespace WMS.Application.Features.Staff.CreateStaff
{
    public class CreateStaffCommandValidator : AbstractValidator<CreateStaffCommand>
    {
        public CreateStaffCommandValidator()
        {
            RuleFor(x => x.FullName)
                .NotEmpty().WithMessage("Tên không được để trống")
                .MinimumLength(2).WithMessage("Tên phải có ít nhất 2 ký tự")
                .MaximumLength(100).WithMessage("Tên không được vượt quá 100 ký tự");

            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email không được để trống")
                .EmailAddress().WithMessage("Email không hợp lệ");

            RuleFor(x => x.Phone)
                .Matches(@"^(\+84|0)?[1-9]\d{8}$")
                .When(x => !string.IsNullOrEmpty(x.Phone))
                .WithMessage("Số điện thoại không hợp lệ");

            RuleFor(x => x.WarehouseId)
                .GreaterThan(0).WithMessage("WarehouseId phải lớn hơn 0");

            RuleFor(x => x.EndDate)
                .GreaterThan(x => x.StartDate)
                .When(x => x.StartDate.HasValue && x.EndDate.HasValue)
                .WithMessage("Ngày kết thúc phải sau ngày bắt đầu");
        }
    }
}
