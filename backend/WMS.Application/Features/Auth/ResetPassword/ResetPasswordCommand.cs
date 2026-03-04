using MediatR;

namespace WMS.Application.Features.Auth.ResetPassword;

public record ResetPasswordCommand(
    string Token,
    string NewPassword
) : IRequest<bool>;
