namespace WMS.Domain.Entities;

/// <summary>
/// Tồn kho hiện tại — số lượng thực của 1 loại tài sản đang lưu tại 1 kho.
/// Được cập nhật mỗi khi staff confirm inventory_request (INBOUND tăng, OUTBOUND giảm).
/// Unique: (asset_id, warehouse_id) — 1 tài sản chỉ có 1 dòng tồn kho tại mỗi kho.
/// </summary>
public partial class RenterInventory
{
    public int InventoryId { get; set; }

    /// <summary>Tài sản (từ catalogue renter_assets)</summary>
    public int AssetId { get; set; }

    public int WarehouseId { get; set; }

    /// <summary>Số lượng tồn kho hiện tại (không âm)</summary>
    public int Quantity { get; set; }

    public DateTime UpdatedAt { get; set; }

    // Navigation
    public virtual RenterAsset Asset { get; set; } = null!;
    public virtual Warehouse Warehouse { get; set; } = null!;
}
