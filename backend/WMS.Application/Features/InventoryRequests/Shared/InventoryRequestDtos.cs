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
    public DateTime? CreatedAt { get; init; }
    public DateTime? ConfirmedAt { get; init; }
    public string? ConfirmedByName { get; init; }
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
        CreatedAt       = r.CreatedAt,
        ConfirmedAt     = r.ConfirmedAt,
        ConfirmedByName = r.ConfirmedByNavigation?.FullName,
        TotalItems      = r.InventoryItems.Count,
        Items           = r.InventoryItems.Select(i => new InventoryItemDto
        {
            ItemId      = i.ItemId,
            ItemName    = i.ItemName,
            Quantity    = i.Quantity,
            Unit        = i.Unit,
            Weight      = i.Weight,
            Description = i.Description,
        }).ToList()
    };
}
