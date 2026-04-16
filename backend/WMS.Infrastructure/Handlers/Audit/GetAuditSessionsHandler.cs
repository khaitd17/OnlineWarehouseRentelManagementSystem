using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common;
using WMS.Application.Features.Audit.GetAuditSessions;
using WMS.Infrastructure.Persistence;
using WMS.Domain.Entities;

namespace WMS.Infrastructure.Handlers.Audit;

public class GetAuditSessionsHandler : IRequestHandler<GetAuditSessionsQuery, ApiResponse<PagedResult<AuditSessionDto>>>
{
    private readonly ApplicationDbContext _db;

    public GetAuditSessionsHandler(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<PagedResult<AuditSessionDto>>> Handle(GetAuditSessionsQuery request, CancellationToken cancellationToken)
    {
        var query = _db.AuditSessions
            .Include(a => a.Warehouse)
            .Include(a => a.CreatedByNavigation)
            .Include(a => a.AssignedToNavigation)
            .Include(a => a.AuditResults)
            .AsQueryable();

        // Role-based filtering
        // OnlyAssignedToMe=true luôn lọc theo assignedTo (dùng cho trang Staff — bất kể user có thêm role OPERATOR/MANAGER ở kho khác)
        var role = request.UserRole?.ToUpper() ?? "";
        if (request.OnlyAssignedToMe && request.UserId.HasValue)
        {
            query = query.Where(a => a.AssignedTo == request.UserId.Value);
        }
        else if (role == "STAFF" && request.UserId.HasValue)
        {
            // STAFF chỉ thấy phiên được giao
            query = query.Where(a => a.AssignedTo == request.UserId.Value);
        }
        else if (role == "RENTER" && request.UserId.HasValue)
        {
            // RENTER chỉ thấy phiên mình tạo
            query = query.Where(a => a.CreatedBy == request.UserId.Value);
        }
        else if (role == "OWNER" && request.UserId.HasValue)
        {
            // OWNER thấy phiên của kho mình sở hữu
            query = query.Where(a => a.Warehouse.OwnerId == request.UserId.Value);
        }
        // ADMIN thấy tất cả

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            query = query.Where(a =>
                a.Warehouse.Name.ToLower().Contains(search) ||
                a.CreatedByNavigation.FullName.ToLower().Contains(search) ||
                (a.Notes != null && a.Notes.ToLower().Contains(search)));
        }

        if (request.WarehouseId.HasValue)
            query = query.Where(a => a.WarehouseId == request.WarehouseId.Value);

        if (!string.IsNullOrWhiteSpace(request.Status))
            query = query.Where(a => a.Status == request.Status.ToUpper());

        query = request.SortBy?.ToLower() switch
        {
            "warehousename" => request.SortOrder.ToLower() == "desc" ? query.OrderByDescending(a => a.Warehouse.Name) : query.OrderBy(a => a.Warehouse.Name),
            "status" => request.SortOrder.ToLower() == "desc" ? query.OrderByDescending(a => a.Status) : query.OrderBy(a => a.Status),
            "completedat" => request.SortOrder.ToLower() == "desc" ? query.OrderByDescending(a => a.CompletedAt) : query.OrderBy(a => a.CompletedAt),
            _ => query.OrderByDescending(a => a.CreatedAt)
        };

        var totalCount = await query.CountAsync(cancellationToken);
        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize < 1 ? 10 : (request.PageSize > 50 ? 50 : request.PageSize);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AuditSessionDto(
                a.AuditId, a.WarehouseId, a.Warehouse.Name,
                a.CreatedBy, a.CreatedByNavigation.FullName,
                a.Status, a.CreatedAt, a.CompletedAt, a.Notes,
                a.AuditResults.Count,
                a.AssignedTo,
                a.AssignedToNavigation != null ? a.AssignedToNavigation.FullName : null))
            .ToListAsync(cancellationToken);

        return ApiResponse<PagedResult<AuditSessionDto>>.SuccessResponse(
            new PagedResult<AuditSessionDto> { Items = items, TotalCount = totalCount, Page = page, PageSize = pageSize },
            "Lấy danh sách phiên kiểm kê thành công.");
    }
}
