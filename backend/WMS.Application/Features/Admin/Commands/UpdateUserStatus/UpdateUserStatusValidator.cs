using FluentValidation;
using WMS.Domain.Constants;

namespace WMS.Application.Features.Admin.Commands.UpdateUserStatus;

public class UpdateUserStatusValidator : AbstractValidator<UpdateUserStatusCommand>
{
    public UpdateUserStatusValidator()
    {
        RuleFor(v => v.UserId).GreaterThan(0);
        RuleFor(v => v.Status).NotEmpty().Must(UserStatus.IsValid)
            .WithMessage("Invalid User Status");
    }
}
