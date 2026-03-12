using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common;
using WMS.Application.Features.Audit.GetAuditResults;
using WMS.Infrastructure.Persistence;
using WMS.Domain.Entities;

namespace WMS.Infrastructure.Handlers.Audit;

public class GetAuditResultsHandler : IRequestHandler<GetAuditResultsQuery, ApiResponse<PagedResult<AuditResultDto>>>
{
    private readonly ApplicationDbContext _db;

    public GetAuditResultsHandler(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<PagedResult<AuditResultDto>>> Handle(GetAuditResultsQuery request, CancellationToken cancellationToken)
    {
        var sessionExists = await _db.AuditSessions.AnyAsync(a => a.AuditId == request.AuditId, cancellationToken);
        if (!sessionExists)
            return ApiResponse<PagedResult<AuditResultDto>>.ErrorResponse($"Không tìm thấy phiên kiểm kê với ID {request.AuditId}.");

        var query = _db.AuditResults.Where(r => r.AuditId == request.AuditId).AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            query = query.Where(r => r.ItemName.ToLower().Contains(search));
        }

        query = request.SortBy?.ToLower() switch
        {
            "itemname" => request.SortOrder.ToLower() == "desc" ? query.OrderByDescending(r => r.ItemName) : query.OrderBy(r => r.ItemName),
            "expectedqty" => request.SortOrder.ToLower() == "desc" ? query.OrderByDescending(r => r.ExpectedQty) : query.OrderBy(r => r.ExpectedQty),
            "actualqty" => request.SortOrder.ToLower() == "desc" ? query.OrderByDescending(r => r.ActualQty) : query.OrderBy(r => r.ActualQty),
            "discrepancy" => request.SortOrder.ToLower() == "desc" ? query.OrderByDescending(r => r.Discrepancy) : query.OrderBy(r => r.Discrepancy),
            _ => query.OrderBy(r => r.ResultId)
        };

        var totalCount = await query.CountAsync(cancellationToken);
        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize < 1 ? 10 : (request.PageSize > 50 ? 50 : request.PageSize);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new AuditResultDto(
                r.ResultId, r.ItemName, r.ExpectedQty, r.ActualQty,
                r.Discrepancy, r.DiscrepancyReason, r.CreatedAt))
            .ToListAsync(cancellationToken);

        return ApiResponse<PagedResult<AuditResultDto>>.SuccessResponse(
            new PagedResult<AuditResultDto> { Items = items, TotalCount = totalCount, Page = page, PageSize = pageSize },
            "Lấy kết quả kiểm kê thành công.");
    }
}
