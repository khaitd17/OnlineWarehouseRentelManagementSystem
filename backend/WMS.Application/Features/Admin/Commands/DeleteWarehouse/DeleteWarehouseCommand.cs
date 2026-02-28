using MediatR;
using WMS.Application.Common.Models;

namespace WMS.Application.Features.Admin.Commands.DeleteWarehouse;

public record DeleteWarehouseCommand(int WarehouseId) : IRequest<ApiResponse<bool>>;
