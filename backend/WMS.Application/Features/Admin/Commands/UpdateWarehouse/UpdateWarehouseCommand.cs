using MediatR;
using WMS.Application.Common.Models;

namespace WMS.Application.Features.Admin.Commands.UpdateWarehouse;

public record UpdateWarehouseCommand(
    int WarehouseId,
    string Name,
    string? Description,
    string Address,
    double? TotalArea,
    double? AvailableArea,
    double? Lat,
    double? Lng,
    string? OperatingHours,
    int OwnerId,
    string Status,
    List<string>? MediaUrls = null
) : IRequest<ApiResponse<bool>>;
