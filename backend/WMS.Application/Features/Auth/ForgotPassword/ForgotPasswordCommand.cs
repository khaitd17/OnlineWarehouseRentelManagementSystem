using MediatR;

namespace WMS.Application.Features.Auth.ForgotPassword;

public record ForgotPasswordCommand(string Email) : IRequest<bool>;
