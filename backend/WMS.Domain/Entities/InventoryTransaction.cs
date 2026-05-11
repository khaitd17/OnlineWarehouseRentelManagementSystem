using System;

namespace WMS.Domain.Entities;

public partial class InventoryTransaction
{
    public int TransactionId { get; set; }
    public int InvReqId { get; set; }
    public string Type { get; set; } = null!;       // "INBOUND" | "OUTBOUND"
    public int WarehouseId { get; set; }
    public string ItemName { get; set; } = null!;
    public int Quantity { get; set; }
    public string Unit { get; set; } = "cái";
    public int PerformedBy { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }

    /// <summary>FK về phiếu nhập/xuất kho (nullable — backward-compatible với data cũ).</summary>
    public int? ReceiptNoteId { get; set; }

    public virtual InventoryRequest InvReq { get; set; } = null!;
    public virtual Warehouse Warehouse { get; set; } = null!;
    public virtual User PerformedByNavigation { get; set; } = null!;
    public virtual ReceiptNote? ReceiptNote { get; set; }
}
