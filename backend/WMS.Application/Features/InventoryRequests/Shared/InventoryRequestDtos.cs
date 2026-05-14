using WMS.Domain.Entities;

namespace WMS.Application.Features.InventoryRequests.Shared;

public record InventoryItemDto
{
    public int ItemId { get; init; }
    public string ItemName { get; init; } = "";
    public int Quantity { get; init; }
    public string Unit { get; init; } = "";
    public decimal? Weight { get; init; }
    /// <summary>diện tích ước tính (m²) do Renter điền.</summary>
    public decimal? EstimatedVolume { get; init; }
    /// <summary>diện tích thực tế Staff xác nhận (m²).</summary>
    public decimal? VerifiedVolume { get; init; }
    /// <summary>Khối lượng thực tế Staff cân (kg).</summary>
    public decimal? VerifiedWeight { get; init; }
    public string? Description { get; init; }
    public int? AssetId { get; init; }
    public string? AssetName { get; init; }
    public decimal? LengthPerUnit { get; init; }
    public decimal? WidthPerUnit { get; init; }
    public decimal? VolumePerUnit { get; init; }
    /// <summary>Số lượng thực tế Staff kiểm đếm. NULL = chưa xác minh.</summary>
    public int? VerifiedQuantity { get; init; }
    /// <summary>Ghi chú xác minh của Staff.</summary>
    public string? VerifyNote { get; init; }
}

public record InventoryRequestDto
{
    public int InvReqId { get; init; }
    /// <summary>Mã yêu cầu — dùng để nhận diện khi nhiều xe đến (VD: INB-20260507-001).</summary>
    public string? RequestCode { get; init; }
    public string Type { get; init; } = "";
    public string? Status { get; init; }
    public int RenterId { get; init; }
    public string RenterName { get; init; } = "";
    public string RenterEmail { get; init; } = "";
    /// <summary>Số điện thoại người thuê — dùng cho QR verify.</summary>
    public string? RenterPhone { get; init; }
    public int WarehouseId { get; init; }
    public string WarehouseName { get; init; } = "";
    public string? Notes { get; init; }
    public bool HasUnpaidBills { get; set; }
    public List<string>? DocumentUrls { get; init; }
    public DateTime? CreatedAt { get; init; }
    public DateTime? ConfirmedAt { get; init; }
    public string? ConfirmedByName { get; init; }
    // Assignment
    public int? AssignedStaffId { get; init; }
    public string? AssignedStaffName { get; init; }
    public string? AssignedNote { get; init; }
    public DateTime? AssignedAt { get; init; }
    public string? ManagerName { get; init; }
    public DateTime? ScheduledDate { get; init; }
    public string? RenterSignatureBase64 { get; init; }
    public string? ManagerSignatureBase64 { get; init; }
    public string? StaffSignatureBase64 { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public int TotalItems { get; init; }
    /// <summary>Tổng diện tích ước tính theo Renter (m²).</summary>
    public decimal? TotalEstimatedVolume { get; init; }
    /// <summary>Tổng diện tích thực tế Staff xác nhận (m²).</summary>
    public decimal? TotalVerifiedVolume { get; init; }
    /// <summary>Cờ cảnh báo diện tích vượt ngưỡng kho.</summary>
    public bool VolumeWarning { get; init; }
    /// <summary>Số phiếu nhập/xuất đã tạo cho yêu cầu này.</summary>
    public int ReceiptNoteCount { get; init; }
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
        RequestCode     = r.RequestCode,
        Type            = r.Type,
        Status          = r.Status,
        RenterId        = r.RenterId,
        RenterName      = r.Renter?.FullName ?? "",
        RenterEmail     = r.Renter?.Email    ?? "",
        RenterPhone     = r.Renter?.Phone,
        WarehouseId     = r.WarehouseId,
        WarehouseName   = r.Warehouse?.Name  ?? "",
        Notes           = r.Notes,
        DocumentUrls    = string.IsNullOrEmpty(r.DocumentUrls)
            ? null
            : System.Text.Json.JsonSerializer.Deserialize<List<string>>(r.DocumentUrls),
        CreatedAt       = r.CreatedAt,
        ConfirmedAt     = r.ConfirmedAt,
        ConfirmedByName = r.ConfirmedByNavigation?.FullName,
        ManagerName     = r.ConfirmedByNavigation?.FullName,
        ScheduledDate   = r.ScheduledDate,
        RenterSignatureBase64 = r.RenterSignatureBase64,
        ManagerSignatureBase64 = r.ManagerSignatureBase64,
        StaffSignatureBase64 = r.StaffSignatureBase64,
        AssignedStaffId   = r.AssignedStaffId,
        AssignedStaffName = r.AssignedStaff?.FullName,
        AssignedNote      = r.AssignedNote,
        AssignedAt        = r.AssignedAt,
        UpdatedAt         = r.UpdatedAt,
        TotalItems      = r.InventoryItems.Count,
        VolumeWarning   = r.VolumeWarning,
        ReceiptNoteCount = r.ReceiptNotes.Count,
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
            LengthPerUnit   = i.Asset?.LengthPerUnit,
            WidthPerUnit    = i.Asset?.WidthPerUnit,
            VolumePerUnit   = i.Asset?.VolumePerUnit,
            VerifiedQuantity = i.VerifiedQuantity,
            VerifyNote      = i.VerifyNote,
            EstimatedVolume = i.EstimatedVolume,
            VerifiedVolume  = i.VerifiedVolume,
            VerifiedWeight  = i.VerifiedWeight,
        }).ToList(),
        TotalEstimatedVolume = r.InventoryItems.Sum(i => i.EstimatedVolume ?? 0) is decimal tv && tv > 0 ? tv : null,
        TotalVerifiedVolume  = r.InventoryItems.Any(i => i.VerifiedVolume.HasValue)
            ? r.InventoryItems.Sum(i => i.VerifiedVolume ?? 0)
            : null,
    };
}

