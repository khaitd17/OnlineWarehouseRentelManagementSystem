using System;
using System.Collections.Generic;

namespace WMS.Domain.Entities;

public partial class InventoryRequest
{
    public int InvReqId { get; set; }

    public int RenterId { get; set; }

    public int WarehouseId { get; set; }

    public string Type { get; set; } = null!;

    public string? Status { get; set; }

    public int? ConfirmedBy { get; set; }

    public DateTime? ConfirmedAt { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public string? Notes { get; set; }

    public string? DocumentUrls { get; set; }

    public virtual User? ConfirmedByNavigation { get; set; }

    public virtual ICollection<InventoryItem> InventoryItems { get; set; } = new List<InventoryItem>();

    public virtual User Renter { get; set; } = null!;

    public virtual Warehouse Warehouse { get; set; } = null!;
}
