using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common;
using WMS.Application.Features.Admin.GetWarehousesLookup;
using WMS.Infrastructure.Persistence;
using WMS.Domain.Entities;

namespace WMS.Infrastructure.Handlers.Admin;

public class GetWarehousesLookupHandler : IRequestHandler<GetWarehousesLookupQuery, ApiResponse<List<WarehouseLookupDto>>>
{
    private readonly ApplicationDbContext _db;

    public GetWarehousesLookupHandler(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<List<WarehouseLookupDto>>> Handle(GetWarehousesLookupQuery request, CancellationToken cancellationToken)
    {
        var warehouses = await _db.Warehouses
            .Include(w => w.Owner)
            .OrderBy(w => w.Name)
            .Select(w => new WarehouseLookupDto(
                w.WarehouseId,
                w.Name,
                w.Address,
                w.Status,
                w.Owner.FullName
            ))
            .ToListAsync(cancellationToken);

        return ApiResponse<List<WarehouseLookupDto>>.SuccessResponse(warehouses, "Lấy danh sách kho thành công.");
    }
}
