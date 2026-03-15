using System;
using System.Collections.Generic;

namespace WMS.Domain.Entities;

public partial class Equipment
{
    public int EquipmentId { get; set; }

    public int WarehouseId { get; set; }

    public string Name { get; set; } = null!;
    
    public string? Type { get; set; }

    public string? Location { get; set; }

    public string? Description { get; set; }

    public string? Specifications { get; set; }

    public string? Status { get; set; }

    public string? IotDeviceId { get; set; }

    public DateOnly? PurchaseDate { get; set; }

    public DateOnly? LastMaintenanceDate { get; set; }

    public DateOnly? NextMaintenanceDate { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Warehouse Warehouse { get; set; } = null!;
}
