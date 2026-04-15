using MediatR;
using WMS.Application.Common;

namespace WMS.Application.Features.Audit.CreateAuditSession;

public record CreateAuditSessionCommand(
    int WarehouseId,
    string? Notes,
    int CreatedBy
) : IRequest<ApiResponse<int>>;
