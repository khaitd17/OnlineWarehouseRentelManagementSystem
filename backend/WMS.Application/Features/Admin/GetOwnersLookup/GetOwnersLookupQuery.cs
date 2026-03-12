using MediatR;
using WMS.Application.Common;

namespace WMS.Application.Features.Admin.GetOwnersLookup;

public record GetOwnersLookupQuery() : IRequest<ApiResponse<List<OwnerLookupDto>>>;

public record OwnerLookupDto(
    int UserId,
    string FullName,
    string Email,
    string? Phone,
    int WarehouseCount
);
