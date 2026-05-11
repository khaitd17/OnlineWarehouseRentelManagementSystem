namespace WMS.Domain.Entities;

/// <summary>
/// Chi tiết hàng hóa trong một phiếu nhập/xuất kho (ReceiptNote).
/// Ghi nhận số lượng thực tế Staff kiểm đếm so với số lượng dự kiến từ InventoryItem.
/// </summary>
public partial class ReceiptItem
{
    public int ReceiptItemId { get; set; }

    /// <summary>FK về phiếu nhập kho.</summary>
    public int ReceiptNoteId { get; set; }

    /// <summary>FK về InventoryItem gốc từ yêu cầu (nullable — cho hàng phát sinh ngoài danh sách).</summary>
    public int? InventoryItemId { get; set; }

    /// <summary>FK về catalogue tài sản (nullable — tương thích khi gõ tên tự do).</summary>
    public int? AssetId { get; set; }

    /// <summary>Tên hàng hóa (copy hoặc gõ mới nếu hàng phát sinh).</summary>
    public string ItemName { get; set; } = null!;

    /// <summary>Số lượng dự kiến (từ InventoryItem.Quantity, hoặc 0 nếu hàng phát sinh).</summary>
    public int ExpectedQuantity { get; set; }

    /// <summary>Số lượng thực tế Staff kiểm đếm — đây là con số dùng để cộng/trừ tồn kho.</summary>
    public int ReceivedQuantity { get; set; }

    public string Unit { get; set; } = "cái";

    /// <summary>Thể tích thực tế Staff đo (m³). Tùy chọn.</summary>
    public decimal? VerifiedVolume { get; set; }

    /// <summary>Khối lượng thực tế Staff cân (kg). Tùy chọn.</summary>
    public decimal? VerifiedWeight { get; set; }

    /// <summary>Ghi chú xác minh (VD: "Thiếu 2 thùng", "Hàng bị ướt").</summary>
    public string? Note { get; set; }

    // Navigation
    public virtual ReceiptNote ReceiptNote { get; set; } = null!;
    public virtual InventoryItem? InventoryItem { get; set; }
    public virtual RenterAsset? Asset { get; set; }
}
