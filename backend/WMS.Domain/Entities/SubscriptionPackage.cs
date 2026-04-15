using System;
using System.Collections.Generic;

namespace WMS.Domain.Entities;

public partial class SubscriptionPackage
{
    public int PackageId { get; set; }
    
    // Gói Basic, Premium, ...
    public string Name { get; set; } = null!;
    
    // Monthly price
    public decimal Price { get; set; }
    
    // Features description
    public string? Description { get; set; }
    
    // Duration in months
    public int DurationMonths { get; set; } = 1;

    // Giới hạn
    public int MaxWarehouses { get; set; } = 1;
    public int MaxStaffPerWarehouse { get; set; } = 5;
    public int MaxZonesPerWarehouse { get; set; } = 3;
    public decimal MaxTotalArea { get; set; } = 500;
    public bool AllowEquipmentManagement { get; set; } = false;
    
    // Is Active
    public bool IsActive { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
