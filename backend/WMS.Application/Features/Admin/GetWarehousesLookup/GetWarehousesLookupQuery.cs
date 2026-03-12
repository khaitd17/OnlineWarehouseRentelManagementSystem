using MediatR;
using WMS.Application.Common;

namespace WMS.Application.Features.Admin.GetWarehousesLookup;

public record GetWarehousesLookupQuery() : IRequest<ApiResponse<List<WarehouseLookupDto>>>;

public record WarehouseLookupDto(
    int WarehouseId,
    string Name,
    string Address,
    string? Status,
    string OwnerName
);
