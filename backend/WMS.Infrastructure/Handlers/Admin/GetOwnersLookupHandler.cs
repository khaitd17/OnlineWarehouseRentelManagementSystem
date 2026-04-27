using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common;
using WMS.Application.Features.Admin.GetOwnersLookup;
using WMS.Infrastructure.Persistence;
using WMS.Domain.Entities;

namespace WMS.Infrastructure.Handlers.Admin;

public class GetOwnersLookupHandler : IRequestHandler<GetOwnersLookupQuery, ApiResponse<List<OwnerLookupDto>>>
{
    private readonly ApplicationDbContext _db;

    public GetOwnersLookupHandler(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<List<OwnerLookupDto>>> Handle(GetOwnersLookupQuery request, CancellationToken cancellationToken)
    {
        var owners = await _db.Users
            .Where(u => u.WarehouseMemberships.Any(m => m.Role.Code == "OWNER"))
            .Select(u => new OwnerLookupDto(
                u.UserId,
                u.FullName,
                u.Email,
                u.Phone,
                _db.Warehouses.Count(w => w.OwnerId == u.UserId)
            ))
            .ToListAsync(cancellationToken);

        var sorted = owners.OrderBy(o => o.FullName).ToList();

        return ApiResponse<List<OwnerLookupDto>>.SuccessResponse(sorted, "Lấy danh sách chủ kho thành công.");
    }
}
