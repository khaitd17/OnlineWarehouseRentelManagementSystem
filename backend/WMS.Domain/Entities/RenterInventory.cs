namespace WMS.Domain.Entities;

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
