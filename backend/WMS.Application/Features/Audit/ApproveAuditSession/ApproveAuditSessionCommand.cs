using MediatR;
using WMS.Application.Common;

namespace WMS.Application.Features.Audit.ApproveAuditSession;

public record ApproveAuditSessionCommand(
    int AuditId,
    int AssignedTo,
    string? Notes,
    int UserId
) : IRequest<ApiResponse<bool>>;

public record RejectAuditSessionCommand(
    int AuditId,
    string? Reason,
    int UserId
) : IRequest<ApiResponse<bool>>;
