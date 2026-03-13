using MediatR;

namespace WMS.Application.Features.Auth.Login;

public record LoginCommand(
    string Email,
    string Password
) : IRequest<LoginResult>;

public record LoginResult(
    int UserId,
    string FullName,
    string Email,
    string Role,
    string Token,
    string? AvatarUrl = null
);
