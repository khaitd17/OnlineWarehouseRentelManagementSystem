using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common.Interfaces;
using WMS.Application.Common.Models;

namespace WMS.Application.Features.Admin.Queries.GetRoles;

public class GetRolesQueryHandler : IRequestHandler<GetRolesQuery, ApiResponse<List<RoleDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetRolesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<List<RoleDto>>> Handle(GetRolesQuery request, CancellationToken cancellationToken)
    {
        var roles = await _context.Roles
            .OrderBy(r => r.RoleName)
            .Select(r => new RoleDto(r.RoleId, r.RoleName, r.Description))
            .ToListAsync(cancellationToken);

        return ApiResponse<List<RoleDto>>.SuccessResult(roles);
    }
}
