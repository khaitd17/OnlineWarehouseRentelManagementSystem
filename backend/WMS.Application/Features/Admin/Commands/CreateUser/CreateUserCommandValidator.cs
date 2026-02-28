using FluentValidation;

namespace WMS.Application.Features.Admin.Commands.CreateUser;

public class CreateUserCommandValidator : AbstractValidator<CreateUserCommand>
{
    public CreateUserCommandValidator()
    {
        RuleFor(v => v.FullName).NotEmpty().MaximumLength(100);
        RuleFor(v => v.Email).NotEmpty().EmailAddress().MaximumLength(100);
        RuleFor(v => v.Password).NotEmpty().MinimumLength(6);
        RuleFor(v => v.RoleId).GreaterThan(0);
    }
}
