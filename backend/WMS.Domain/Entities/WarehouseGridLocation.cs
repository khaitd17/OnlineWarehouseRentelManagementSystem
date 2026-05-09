using System;

namespace WMS.Domain.Entities;

public partial class WarehouseGridLocation
{
    public int Id { get; set; }

    public int WarehouseId { get; set; }

    public string Coordinates { get; set; } = "[]"; // JSON array of {x, y}

    public int? AssetId { get; set; }

    public string? ItemName { get; set; }

    public int? RenterId { get; set; }

    public int Quantity { get; set; }

    public DateTime UpdatedAt { get; set; }

    // Navigation
    public virtual Warehouse Warehouse { get; set; } = null!;
    public virtual RenterAsset? Asset { get; set; }
    public virtual User? Renter { get; set; }
}
