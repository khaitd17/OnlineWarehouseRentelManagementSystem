namespace WMS.Domain.Entities;

/// <summary>
/// Catalogue tài sản của người thuê.
/// Mỗi loại hàng hoá (vd: "Mì tôm Hảo Hảo") là 1 bản ghi — độc lập với số lần nhập kho.
/// Các lần nhập/xuất đều tham chiếu về asset_id này thay vì gõ lại tên tự do.
/// </summary>
public partial class RenterAsset
{
    public int AssetId { get; set; }

    /// <summary>Chủ tài sản (renter)</summary>
    public int RenterId { get; set; }

    /// <summary>Tên tài sản (vd: "Mì tôm Hảo Hảo 75g")</summary>
    public string AssetName { get; set; } = null!;

    /// <summary>Đơn vị tính: cái, kg, thùng, hộp…</summary>
    public string Unit { get; set; } = "cái";

    /// <summary>Khối lượng / đơn vị (kg) — tuỳ chọn</summary>
    public decimal? WeightPerUnit { get; set; }

    /// <summary>diện tích / đơn vị (m²) — tuỳ chọn, dùng khi tính ước lượng m² cho yêu cầu nhập kho.</summary>
    public decimal? VolumePerUnit { get; set; }

    /// <summary>Chiều dài / đơn vị (m) do thủ kho đo gần nhất.</summary>
    public decimal? LengthPerUnit { get; set; }

    /// <summary>Chiều rộng / đơn vị (m) do thủ kho đo gần nhất.</summary>
    public decimal? WidthPerUnit { get; set; }

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; }

    // Navigation
    public virtual User Renter { get; set; } = null!;

    /// <summary>Các dòng inventory_items tham chiếu về asset này</summary>
    public virtual ICollection<InventoryItem> InventoryItems { get; set; } = new List<InventoryItem>();

    /// <summary>Tồn kho hiện tại của asset này tại các kho</summary>
    public virtual ICollection<RenterInventory> Inventories { get; set; } = new List<RenterInventory>();
}

