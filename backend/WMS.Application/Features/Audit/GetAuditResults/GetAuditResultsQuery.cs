using System.Text.Json.Serialization;
using MediatR;
using WMS.Application.Common;

namespace WMS.Application.Features.Audit.GetAuditResults;

public class GetAuditResultsQuery : IRequest<ApiResponse<PagedResult<AuditResultDto>>>
{
    [JsonIgnore]
    public int AuditId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SortBy { get; set; }
    public string SortOrder { get; set; } = "asc";
    public string? Search { get; set; }
}

public record AuditResultDto(
    int ResultId,
    string ItemName,
    int ExpectedQty,
    int ActualQty,
    int? Discrepancy,
    string? DiscrepancyReason,
    DateTime? CreatedAt
);
