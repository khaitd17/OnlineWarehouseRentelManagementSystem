using System;
using System.Collections.Generic;

namespace WMS.Infrastructure.Persistence.ScaffoldModels;

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

    public double AvailableArea { get; set; }

    public string? OperatingHours { get; set; }

    public string? Status { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? ApprovedAt { get; set; }

    public int? ApprovedBy { get; set; }

    public string? RejectionReason { get; set; }

    public virtual User? ApprovedByNavigation { get; set; }

    public virtual ICollection<AuditSession> AuditSessions { get; set; } = new List<AuditSession>();

    public virtual ICollection<Contract> Contracts { get; set; } = new List<Contract>();

    public virtual ICollection<Equipment> Equipment { get; set; } = new List<Equipment>();

    public virtual ICollection<InventoryRequest> InventoryRequests { get; set; } = new List<InventoryRequest>();

    public virtual User Owner { get; set; } = null!;

    public virtual ICollection<Rating> Ratings { get; set; } = new List<Rating>();

    public virtual ICollection<RentalRequest> RentalRequests { get; set; } = new List<RentalRequest>();

    public virtual ICollection<StaffAssignment> StaffAssignments { get; set; } = new List<StaffAssignment>();

    public virtual ICollection<Task> Tasks { get; set; } = new List<Task>();

    public virtual ICollection<WarehouseDocument> WarehouseDocuments { get; set; } = new List<WarehouseDocument>();

    public virtual ICollection<WarehouseMedium> WarehouseMedia { get; set; } = new List<WarehouseMedium>();
}
