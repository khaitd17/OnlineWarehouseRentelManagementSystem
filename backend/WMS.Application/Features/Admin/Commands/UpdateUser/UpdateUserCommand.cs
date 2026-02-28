using MediatR;
using WMS.Application.Common.Models;

namespace WMS.Application.Features.Admin.Commands.UpdateUser;

public record UpdateUserCommand(
    int UserId,
    string FullName,
    string Email,
    string? Phone,
    int RoleId,
    string? AvatarUrl,
    string Status
) : IRequest<ApiResponse<bool>>;
