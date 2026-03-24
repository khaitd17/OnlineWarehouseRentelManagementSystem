using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace WMS.Domain.Entities;

public partial class Warehouse
{
    public int WarehouseId { get; set; }

    public int OwnerId { get; set; }

    public string Name { get; set; } = null!;

    public string Address { get; set; } = null!;

    public double? Lat { get; set; }

    public double? Lng { get; set; }

    public string? Description { get; set; }

    public double TotalArea { get; set; }

    public double? Width { get; set; }
    public double? Length { get; set; }
    public string? MainDoorDirection { get; set; }

    public double AvailableArea { get; set; }

    public string? OperatingHours { get; set; }
    
    public bool Is24HoursAccess { get; set; } = false;
    public TimeSpan? OpenTime { get; set; }
    public TimeSpan? CloseTime { get; set; }

    public string? Status { get; set; }

    [NotMapped]
    public bool HasZone { get; set; } = false;

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? ApprovedAt { get; set; }

    public int? ApprovedBy { get; set; }

    public string? RejectionReason { get; set; }

    public bool IsCurrentlyAccessible()
    {
        if (Is24HoursAccess) return true;
        if (!OpenTime.HasValue || !CloseTime.HasValue) return true; // Default to true if not set? Or false? User said require input.

        var now = DateTime.Now.TimeOfDay;
        if (OpenTime < CloseTime)
        {
            return now >= OpenTime && now <= CloseTime;
        }
        else 
        {
            // Case where it closes after midnight (e.g. 22:00 - 04:00)
            return now >= OpenTime || now <= CloseTime;
        }
    }

    public virtual User? ApprovedByNavigation { get; set; }

    public virtual ICollection<AuditSession> AuditSessions { get; set; } = new List<AuditSession>();

    public virtual ICollection<Contract> Contracts { get; set; } = new List<Contract>();

    public virtual ICollection<Equipment> Equipment { get; set; } = new List<Equipment>();

    public virtual ICollection<InventoryRequest> InventoryRequests { get; set; } = new List<InventoryRequest>();

    public virtual User Owner { get; set; } = null!;

    public virtual ICollection<Rating> Ratings { get; set; } = new List<Rating>();

    public virtual ICollection<RentalRequest> RentalRequests { get; set; } = new List<RentalRequest>();

    public virtual ICollection<WarehouseTask> Tasks { get; set; } = new List<WarehouseTask>();

    public virtual ICollection<WarehouseDocument> WarehouseDocuments { get; set; } = new List<WarehouseDocument>();

    public virtual ICollection<WarehouseMedium> WarehouseMedia { get; set; } = new List<WarehouseMedium>();
    
    public ICollection<WarehouseMembership> WarehouseMemberships { get; set; } = new List<WarehouseMembership>();

    public virtual ICollection<Zone> Zones { get; set; } = new List<Zone>();

    public virtual ICollection<RentalArea> RentalAreas { get; set; } = new List<RentalArea>();

    // Alias for WarehouseMedia to support legacy code
    // Alias for WarehouseMedia to support legacy code - NotMapped so EF Core ignores it
    [NotMapped]
    public ICollection<WarehouseMedium> Images => WarehouseMedia;
}