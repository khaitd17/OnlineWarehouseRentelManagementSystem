using FluentValidation;
using WMS.Domain.Constants;

namespace WMS.Application.Features.Admin.Commands.UpdateUser;

public class UpdateUserCommandValidator : AbstractValidator<UpdateUserCommand>
{
    public UpdateUserCommandValidator()
    {
        RuleFor(v => v.UserId).GreaterThan(0);
        RuleFor(v => v.FullName).NotEmpty().MaximumLength(100);
        RuleFor(v => v.Email).NotEmpty().EmailAddress().MaximumLength(100);
        RuleFor(v => v.RoleId).GreaterThan(0);
        RuleFor(v => v.Status).NotEmpty().Must(UserStatus.IsValid)
            .WithMessage("Invalid User Status");
    }
}
