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
    public int RenterId { get; set; }
    public bool HasUnpaidBills { get; set; }
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = null!;
    public DateTime? CreatedAt { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public string? Notes { get; set; }
    public int TotalItems { get; set; }
    public List<InventoryItemDto> Items { get; set; } = new();

    // ── Timeline fields ──────────────────────────────────────────
    /// <summary>Tên Manager đã duyệt yêu cầu</summary>
    public string? ConfirmedByName { get; set; }

    /// <summary>Tên Staff được giao xử lý yêu cầu</summary>
    public string? AssignedStaffName { get; set; }

    /// <summary>Email của Staff được giao</summary>
    public string? AssignedStaffEmail { get; set; }

    /// <summary>Thời điểm Manager giao việc cho Staff</summary>
    public DateTime? AssignedAt { get; set; }

    /// <summary>Ghi chú nội bộ từ Manager khi giao việc</summary>
    public string? AssignedNote { get; set; }

    /// <summary>Thời điểm yêu cầu hoàn thành hoặc bị từ chối (UpdatedAt khi status thay đổi lần cuối)</summary>
    public DateTime? UpdatedAt { get; set; }
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
