using System;

namespace WMS.Domain.Entities;

public partial class WarehouseInventory
{
    public int InventoryId { get; set; }
    public int WarehouseId { get; set; }
    public string ItemName { get; set; } = null!;
    public int Quantity { get; set; }
    public string Unit { get; set; } = "cái";
    public DateTime UpdatedAt { get; set; }

    public virtual Warehouse Warehouse { get; set; } = null!;
}
