using MediatR;

namespace WMS.Application.Features.InventoryRequests.GetOwnerInventoryRequests;

public class GetOwnerInventoryRequestsQuery : IRequest<OwnerInventoryRequestsResult>
{
    public int OwnerId { get; set; }
    public string Type { get; set; } = "INBOUND"; // INBOUND | OUTBOUND
    public string? Status { get; set; }
    public int? WarehouseId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class OwnerInventoryRequestsResult
{
    public List<InventoryRequestDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

public class InventoryRequestDto
{
    public int InvReqId { get; set; }
    public string Type { get; set; } = null!;
    public string? Status { get; set; }
    public string RenterName { get; set; } = null!;
    public string RenterEmail { get; set; } = null!;
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = null!;
    public DateTime? CreatedAt { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public string? Notes { get; set; }
    public int TotalItems { get; set; }
    public List<InventoryItemDto> Items { get; set; } = new();
}

public class InventoryItemDto
{
    public int ItemId { get; set; }
    public string ItemName { get; set; } = null!;
    public int Quantity { get; set; }
    public string Unit { get; set; } = null!;
    public decimal? Weight { get; set; }
    public string? Description { get; set; }
}
