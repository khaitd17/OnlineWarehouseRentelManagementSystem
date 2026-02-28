using MediatR;
using WMS.Application.Common.Models;

namespace WMS.Application.Features.Admin.Commands.CreateUser;

public record CreateUserCommand(
    string FullName,
    string Email,
    string Password,
    string? Phone,
    int RoleId,
    string? AvatarUrl
) : IRequest<ApiResponse<int>>;
