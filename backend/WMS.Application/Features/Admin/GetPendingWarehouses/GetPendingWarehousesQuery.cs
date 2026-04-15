using MediatR;
using WMS.Application.Common;

namespace WMS.Application.Features.Admin.GetPendingWarehouses;

public class GetPendingWarehousesQuery : IRequest<ApiResponse<PagedResult<PendingWarehouseDto>>>
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? Search { get; set; }
    public string SortBy { get; set; } = "createdAt";
    public string SortOrder { get; set; } = "desc";
}

public record PendingWarehouseDto(
    int WarehouseId,
    string Name,
    string Address,
    string? WarehouseType,
    double TotalArea,
    double AvailableArea,
    string? Status,
    DateTime? CreatedAt,
    int OwnerId,
    string OwnerName,
    string OwnerEmail,
    string? OwnerPhone,  // maps to User.Phone
    int MediaCount,
    int DocumentCount,
    string SubmissionType,        // "NEW" | "PRICE_UPDATE"
    string? PendingChangeNote     // auto-generated change description
);
