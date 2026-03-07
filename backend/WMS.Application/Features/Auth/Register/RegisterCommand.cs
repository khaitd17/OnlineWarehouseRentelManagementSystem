using MediatR;

namespace WMS.Application.Features.Auth.Register;

public record RegisterCommand(
    string FullName,
    string Email,
    string Password,
    string? Phone,
    string RoleName
) : IRequest<int>;
