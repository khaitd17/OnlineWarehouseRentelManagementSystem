using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common;
using WMS.Application.Features.Admin.GetWarehousesByOwner;
using WMS.Infrastructure.Persistence.ScaffoldModels;

namespace WMS.Infrastructure.Handlers.Admin;

public class GetWarehousesByOwnerHandler : IRequestHandler<GetWarehousesByOwnerQuery, ApiResponse<PagedResult<OwnerWarehouseDto>>>
{
    private readonly ApplicationDbContext _db;

    public GetWarehousesByOwnerHandler(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<PagedResult<OwnerWarehouseDto>>> Handle(GetWarehousesByOwnerQuery request, CancellationToken cancellationToken)
    {
        var ownerExists = await _db.Users.AnyAsync(u => u.UserId == request.OwnerId, cancellationToken);
        if (!ownerExists)
        {
            return ApiResponse<PagedResult<OwnerWarehouseDto>>.ErrorResponse($"Không tìm thấy chủ kho với ID {request.OwnerId}.");
        }

        var query = _db.Warehouses.Where(w => w.OwnerId == request.OwnerId).AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            query = query.Where(w => w.Name.ToLower().Contains(search) || w.Address.ToLower().Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            query = query.Where(w => w.Status == request.Status.ToUpper());
        }

        query = request.SortBy?.ToLower() switch
        {
            "name" => request.SortOrder.ToLower() == "desc" ? query.OrderByDescending(w => w.Name) : query.OrderBy(w => w.Name),
            "totalarea" => request.SortOrder.ToLower() == "desc" ? query.OrderByDescending(w => w.TotalArea) : query.OrderBy(w => w.TotalArea),
            "availablearea" => request.SortOrder.ToLower() == "desc" ? query.OrderByDescending(w => w.AvailableArea) : query.OrderBy(w => w.AvailableArea),
            "status" => request.SortOrder.ToLower() == "desc" ? query.OrderByDescending(w => w.Status) : query.OrderBy(w => w.Status),
            "createdat" => request.SortOrder.ToLower() == "desc" ? query.OrderByDescending(w => w.CreatedAt) : query.OrderBy(w => w.CreatedAt),
            _ => query.OrderByDescending(w => w.CreatedAt)
        };

        var totalCount = await query.CountAsync(cancellationToken);
        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize < 1 ? 10 : (request.PageSize > 50 ? 50 : request.PageSize);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(w => new OwnerWarehouseDto(
                w.WarehouseId, w.Name, w.Address, w.TotalArea, w.AvailableArea,
                w.Status, w.OperatingHours, w.CreatedAt, w.ApprovedAt
            ))
            .ToListAsync(cancellationToken);

        return ApiResponse<PagedResult<OwnerWarehouseDto>>.SuccessResponse(
            new PagedResult<OwnerWarehouseDto> { Items = items, TotalCount = totalCount, Page = page, PageSize = pageSize },
            "Lấy danh sách kho theo chủ sở hữu thành công.");
    }
}
