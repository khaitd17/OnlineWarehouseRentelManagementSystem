using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common;
using WMS.Application.Features.Audit.GetAuditSessionDetail;
using WMS.Infrastructure.Persistence;
using WMS.Domain.Entities;

namespace WMS.Infrastructure.Handlers.Audit;

public class GetAuditSessionDetailHandler : IRequestHandler<GetAuditSessionDetailQuery, ApiResponse<AuditSessionDetailDto>>
{
    private readonly ApplicationDbContext _db;

    public GetAuditSessionDetailHandler(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<AuditSessionDetailDto>> Handle(GetAuditSessionDetailQuery request, CancellationToken cancellationToken)
    {
        var session = await _db.AuditSessions
            .Include(a => a.Warehouse)
            .Include(a => a.CreatedByNavigation)
            .Include(a => a.AuditResults)
            .FirstOrDefaultAsync(a => a.AuditId == request.AuditId, cancellationToken);

        if (session == null)
            return ApiResponse<AuditSessionDetailDto>.ErrorResponse($"Không tìm thấy phiên kiểm kê với ID {request.AuditId}.");

        var results = session.AuditResults
            .OrderBy(r => r.ResultId)
            .Select(r => new AuditResultItemDto(
                r.ResultId, r.ItemName, r.ExpectedQty, r.ActualQty,
                r.Discrepancy, r.DiscrepancyReason, r.CreatedAt))
            .ToList();

        var summary = new AuditSummaryDto(
            results.Count,
            results.Count(r => r.Discrepancy == 0),
            results.Count(r => r.Discrepancy != 0),
            results.Sum(r => r.ExpectedQty),
            results.Sum(r => r.ActualQty),
            results.Sum(r => r.Discrepancy ?? 0));

        var dto = new AuditSessionDetailDto(
            session.AuditId, session.WarehouseId, session.Warehouse.Name,
            session.Warehouse.Address, session.CreatedBy,
            session.CreatedByNavigation.FullName, session.Status,
            session.CreatedAt, session.CompletedAt, session.Notes,
            results, summary);

        return ApiResponse<AuditSessionDetailDto>.SuccessResponse(dto, "Lấy chi tiết phiên kiểm kê thành công.");
    }
}
