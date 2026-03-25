using System;
using System.Collections.Generic;

namespace WMS.Domain.Entities;

public partial class InventoryItem
{
    public int ItemId { get; set; }

    public int InvReqId { get; set; }

    public string ItemName { get; set; } = null!;

    public int Quantity { get; set; }

    public string Unit { get; set; } = null!;

    public decimal? Weight { get; set; }

    public string? Description { get; set; }

    public virtual InventoryRequest InvReq { get; set; } = null!;

    /// <summary>
    /// FK về catalogue tài sản (nullable — tương thích ngược với dữ liệu cũ).
    /// Khi có giá trị: hệ thống có thể cộng/trừ tồn kho chính xác theo asset.
    /// </summary>
    public int? AssetId { get; set; }
    public virtual RenterAsset? Asset { get; set; }
}
