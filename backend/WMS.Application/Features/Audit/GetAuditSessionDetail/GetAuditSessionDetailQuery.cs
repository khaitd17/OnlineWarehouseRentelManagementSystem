using MediatR;
using WMS.Application.Common;

namespace WMS.Application.Features.Audit.GetAuditSessionDetail;

public record GetAuditSessionDetailQuery(int AuditId) : IRequest<ApiResponse<AuditSessionDetailDto>>;

public record AuditSessionDetailDto(
    int AuditId,
    int WarehouseId,
    string WarehouseName,
    string WarehouseAddress,
    int CreatedBy,
    string CreatedByName,
    string? Status,
    DateTime? CreatedAt,
    DateTime? CompletedAt,
    string? Notes,
    List<AuditResultItemDto> Results,
    AuditSummaryDto Summary
);

public record AuditResultItemDto(
    int ResultId,
    string ItemName,
    int ExpectedQty,
    int ActualQty,
    int? Discrepancy,
    string? DiscrepancyReason,
    DateTime? CreatedAt
);

public record AuditSummaryDto(
    int TotalItems,
    int MatchedItems,
    int DiscrepancyItems,
    int TotalExpected,
    int TotalActual,
    int TotalDiscrepancy
);
