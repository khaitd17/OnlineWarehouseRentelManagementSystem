using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common;
using WMS.Application.Features.Admin.GetRoles;
using WMS.Infrastructure.Persistence.ScaffoldModels;

namespace WMS.Infrastructure.Handlers.Admin;

public class GetRolesHandler : IRequestHandler<GetRolesQuery, ApiResponse<List<RoleDto>>>
{
    private readonly ApplicationDbContext _db;

    public GetRolesHandler(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<List<RoleDto>>> Handle(GetRolesQuery request, CancellationToken cancellationToken)
    {
        var roles = await _db.Roles
            .OrderBy(r => r.RoleId)
            .Select(r => new RoleDto(r.RoleId, r.RoleName, r.Description))
            .ToListAsync(cancellationToken);

        return ApiResponse<List<RoleDto>>.SuccessResponse(roles, "Lấy danh sách vai trò thành công.");
    }
}
