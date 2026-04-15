using WMS.Domain.Entities;

namespace WMS.Application.Features.InventoryRequests.Shared;

public record InventoryItemDto
{
    public int ItemId { get; init; }
    public string ItemName { get; init; } = "";
    public int Quantity { get; init; }
    public string Unit { get; init; } = "";
    public decimal? Weight { get; init; }
    public string? Description { get; init; }
    public int? AssetId { get; init; }
    public string? AssetName { get; init; }
    /// <summary>Số lượng thực tế Staff kiểm đếm. NULL = chưa xác minh.</summary>
    public int? VerifiedQuantity { get; init; }
    /// <summary>Ghi chú xác minh của Staff.</summary>
    public string? VerifyNote { get; init; }
}

public record InventoryRequestDto
{
    public int InvReqId { get; init; }
    public string Type { get; init; } = "";
    public string? Status { get; init; }
    public int RenterId { get; init; }
    public string RenterName { get; init; } = "";
    public string RenterEmail { get; init; } = "";
    public int WarehouseId { get; init; }
    public string WarehouseName { get; init; } = "";
    public string? Notes { get; init; }
    public List<string>? DocumentUrls { get; init; }
    public DateTime? CreatedAt { get; init; }
    public DateTime? ConfirmedAt { get; init; }
    public string? ConfirmedByName { get; init; }
    // Assignment
    public int? AssignedStaffId { get; init; }
    public string? AssignedStaffName { get; init; }
    public string? AssignedNote { get; init; }
    public DateTime? AssignedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public int TotalItems { get; init; }
    public List<InventoryItemDto> Items { get; init; } = new();
}

public record PagedResult<T>
{
    public List<T> Items { get; init; } = new();
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalPages { get; init; }
}

public static class InventoryRequestMapper
{
    public static InventoryRequestDto ToDto(InventoryRequest r) => new()
    {
        InvReqId        = r.InvReqId,
        Type            = r.Type,
        Status          = r.Status,
        RenterId        = r.RenterId,
        RenterName      = r.Renter?.FullName ?? "",
        RenterEmail     = r.Renter?.Email    ?? "",
        WarehouseId     = r.WarehouseId,
        WarehouseName   = r.Warehouse?.Name  ?? "",
        Notes           = r.Notes,
        DocumentUrls    = string.IsNullOrEmpty(r.DocumentUrls)
            ? null
            : System.Text.Json.JsonSerializer.Deserialize<List<string>>(r.DocumentUrls),
        CreatedAt       = r.CreatedAt,
        ConfirmedAt     = r.ConfirmedAt,
        ConfirmedByName = r.ConfirmedByNavigation?.FullName,
        AssignedStaffId   = r.AssignedStaffId,
        AssignedStaffName = r.AssignedStaff?.FullName,
        AssignedNote      = r.AssignedNote,
        AssignedAt        = r.AssignedAt,
        UpdatedAt         = r.UpdatedAt,
        TotalItems      = r.InventoryItems.Count,
        Items           = r.InventoryItems.Select(i => new InventoryItemDto
        {
            ItemId          = i.ItemId,
            ItemName        = i.ItemName,
            Quantity        = i.Quantity,
            Unit            = i.Unit,
            Weight          = i.Weight,
            Description     = i.Description,
            AssetId         = i.AssetId,
            AssetName       = i.Asset?.AssetName,
            VerifiedQuantity = i.VerifiedQuantity,
            VerifyNote      = i.VerifyNote,
        }).ToList()
    };
}
