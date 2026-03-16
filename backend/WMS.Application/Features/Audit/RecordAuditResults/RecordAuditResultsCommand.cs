using MediatR;
using WMS.Application.Common;

namespace WMS.Application.Features.Audit.RecordAuditResults;

public record RecordAuditResultsCommand(
    int AuditId,
    List<AuditResultInput> Items,
    bool CompleteSession,
    int UserId
) : IRequest<ApiResponse<bool>>;

public record AuditResultInput(
    string ItemName,
    int ExpectedQty,
    int ActualQty,
    string? DiscrepancyReason
);
