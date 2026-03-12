using MediatR;
using WMS.Application.Common;

namespace WMS.Application.Features.Admin.ApproveWarehouse;

public record ApproveWarehouseCommand(
    int WarehouseId,
    bool IsApproved,
    string? RejectionReason,
    int ApprovedBy
) : IRequest<ApiResponse<bool>>;
