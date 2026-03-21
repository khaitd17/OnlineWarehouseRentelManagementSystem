using MediatR;
using WMS.Application.Common;

namespace WMS.Application.Features.Audit.CloseAuditSession;

public record CloseAuditSessionCommand(int AuditId, string? Notes, int UserId) : IRequest<ApiResponse<bool>>;
