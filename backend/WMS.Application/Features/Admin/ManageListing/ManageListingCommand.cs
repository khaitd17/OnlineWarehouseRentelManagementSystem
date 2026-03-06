using MediatR;
using WMS.Application.Common;

namespace WMS.Application.Features.Admin.ManageListing;

public record ManageListingCommand(
    int WarehouseId,
    string Action // SHOW, HIDE, or DELETE
) : IRequest<ApiResponse<bool>>;
