using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common.Interfaces;
using WMS.Application.Common.Models;

namespace WMS.Application.Features.Admin.Queries.GetOwners;

public class GetOwnersQueryHandler : IRequestHandler<GetOwnersQuery, ApiResponse<List<OwnerDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetOwnersQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<List<OwnerDto>>> Handle(GetOwnersQuery request, CancellationToken cancellationToken)
    {
        var owners = await _context.Users
            .Include(u => u.Role)
            .Where(u => u.Role.RoleName == "OWNER")
            .OrderBy(u => u.FullName)
            .Select(u => new OwnerDto(u.UserId, u.FullName, u.Email))
            .ToListAsync(cancellationToken);

        return ApiResponse<List<OwnerDto>>.SuccessResult(owners);
    }
}
