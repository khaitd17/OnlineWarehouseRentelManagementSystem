using MediatR;
using WMS.Application.Common.Models;

namespace WMS.Application.Features.Admin.Queries.GetRoles;

public class GetRolesQuery : IRequest<ApiResponse<List<RoleDto>>>
{
}
