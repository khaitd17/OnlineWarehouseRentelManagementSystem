using MediatR;
using WMS.Application.Common.Models;

namespace WMS.Application.Features.Admin.Commands.ApproveWarehouse;

public record ApproveWarehouseCommand(int WarehouseId, bool IsApproved, string? RejectionReason = null) : IRequest<ApiResponse<bool>>;
