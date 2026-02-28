using MediatR;
using WMS.Application.Common.Models;

namespace WMS.Application.Features.Admin.Commands.CreateWarehouse;

public record CreateWarehouseCommand(
    string Name,
    string? Description,
    string Address,
    double? TotalArea,
    double? AvailableArea,
    double? Lat,
    double? Lng,
    string? OperatingHours,
    int OwnerId,
    List<string>? MediaUrls = null
) : IRequest<ApiResponse<int>>;
