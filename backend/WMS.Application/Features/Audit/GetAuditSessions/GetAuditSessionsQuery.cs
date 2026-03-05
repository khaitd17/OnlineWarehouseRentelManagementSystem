using MediatR;
using WMS.Application.Common;

namespace WMS.Application.Features.Audit.GetAuditSessions;

public class GetAuditSessionsQuery : IRequest<ApiResponse<PagedResult<AuditSessionDto>>>
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SortBy { get; set; }
    public string SortOrder { get; set; } = "asc";
    public string? Search { get; set; }
    public int? WarehouseId { get; set; }
    public string? Status { get; set; }
}

public record AuditSessionDto(
    int AuditId,
    int WarehouseId,
    string WarehouseName,
    int CreatedBy,
    string CreatedByName,
    string? Status,
    DateTime? CreatedAt,
    DateTime? CompletedAt,
    string? Notes,
    int TotalResults
);
