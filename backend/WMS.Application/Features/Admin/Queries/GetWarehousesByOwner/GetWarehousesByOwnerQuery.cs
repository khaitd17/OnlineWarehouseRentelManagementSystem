using MediatR;
using WMS.Application.Common.Models;

namespace WMS.Application.Features.Admin.Queries.GetWarehousesByOwner;

public record GetWarehousesByOwnerQuery(int? OwnerId = null) : PaginationParams, IRequest<ApiResponse<PaginatedList<WarehouseDto>>>;

public record WarehouseDto(
    int WarehouseId,
    string Name,
    string Address,
    string OwnerName,
    double? TotalArea,
    double? AvailableArea,
    string Status,
    DateTime CreatedAt
);
