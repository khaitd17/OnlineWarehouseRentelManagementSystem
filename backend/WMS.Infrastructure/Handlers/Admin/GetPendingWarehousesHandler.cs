using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common;
using WMS.Application.Features.Admin.GetPendingWarehouses;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Handlers.Admin;

public class GetPendingWarehousesHandler : IRequestHandler<GetPendingWarehousesQuery, ApiResponse<PagedResult<PendingWarehouseDto>>>
{
    private readonly ApplicationDbContext _db;

    public GetPendingWarehousesHandler(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<PagedResult<PendingWarehouseDto>>> Handle(
        GetPendingWarehousesQuery request,
        CancellationToken cancellationToken)
    {
        var query = _db.Warehouses
            .Include(w => w.Owner)
            .Include(w => w.WarehouseMedia)
            .Include(w => w.WarehouseDocuments)
            .Where(w => w.Status == "PENDING");

        // Search
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            query = query.Where(w =>
                w.Name.ToLower().Contains(search) ||
                w.Address.ToLower().Contains(search) ||
                w.Owner.FullName.ToLower().Contains(search) ||
                w.Owner.Email.ToLower().Contains(search));
        }

        // Sorting
        query = (request.SortBy?.ToLower(), request.SortOrder?.ToLower()) switch
        {
            ("name", "asc")      => query.OrderBy(w => w.Name),
            ("name", _)          => query.OrderByDescending(w => w.Name),
            ("totalarea", "asc") => query.OrderBy(w => w.TotalArea),
            ("totalarea", _)     => query.OrderByDescending(w => w.TotalArea),
            ("owner", "asc")     => query.OrderBy(w => w.Owner.FullName),
            ("owner", _)         => query.OrderByDescending(w => w.Owner.FullName),
            (_, "asc")           => query.OrderBy(w => w.CreatedAt),
            _                    => query.OrderByDescending(w => w.CreatedAt),
        };

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var dtos = items.Select(w => new PendingWarehouseDto(
            w.WarehouseId,
            w.Name,
            w.Address,
            w.TotalArea,
            w.AvailableArea,
            w.Status,
            w.CreatedAt,
            w.OwnerId,
            w.Owner?.FullName ?? "—",
            w.Owner?.Email ?? "—",
            w.Owner?.Phone,
            w.WarehouseMedia.Count,
            w.WarehouseDocuments.Count,
            w.SubmissionType ?? "NEW",
            w.PendingChangeNote
        )).ToList();


        var result = new PagedResult<PendingWarehouseDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize,
            // TotalPages is a computed property, no need to set it
        };

        return ApiResponse<PagedResult<PendingWarehouseDto>>.SuccessResponse(result);
    }
}
