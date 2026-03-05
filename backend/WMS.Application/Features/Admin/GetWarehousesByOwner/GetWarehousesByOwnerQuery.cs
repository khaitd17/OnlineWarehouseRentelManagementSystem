using System.Text.Json.Serialization;
using MediatR;
using WMS.Application.Common;

namespace WMS.Application.Features.Admin.GetWarehousesByOwner;

public class GetWarehousesByOwnerQuery : IRequest<ApiResponse<PagedResult<OwnerWarehouseDto>>>
{
    [JsonIgnore]
    public int OwnerId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SortBy { get; set; }
    public string SortOrder { get; set; } = "asc";
    public string? Search { get; set; }
    public string? Status { get; set; }
}

public record OwnerWarehouseDto(
    int WarehouseId,
    string Name,
    string Address,
    double TotalArea,
    double AvailableArea,
    string? Status,
    string? OperatingHours,
    DateTime? CreatedAt,
    DateTime? ApprovedAt
);
