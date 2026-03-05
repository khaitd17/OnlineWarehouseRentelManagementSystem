using MediatR;
using WMS.Application.Common;

namespace WMS.Application.Features.Admin.GetRoles;

public record GetRolesQuery() : IRequest<ApiResponse<List<RoleDto>>>;

public record RoleDto(
    int RoleId,
    string RoleName,
    string? Description
);
