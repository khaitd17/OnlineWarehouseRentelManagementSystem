using System;
using System.Collections.Generic;

namespace WMS.Domain.Entities;

public partial class User
{
    public int UserId { get; set; }

    public int RoleId { get; set; }

    public string FullName { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public string? Phone { get; set; }

    public string? AvatarUrl { get; set; }

    public string? Status { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? LastLoginAt { get; set; }

    public virtual ICollection<AuditSession> AuditSessions { get; set; } = new List<AuditSession>();

    public virtual ICollection<Contract> Contracts { get; set; } = new List<Contract>();

    public virtual ICollection<InventoryRequest> InventoryRequestConfirmedByNavigations { get; set; } = new List<InventoryRequest>();

    public virtual ICollection<InventoryRequest> InventoryRequestRenters { get; set; } = new List<InventoryRequest>();

    public virtual ICollection<Rating> Ratings { get; set; } = new List<Rating>();

    public virtual ICollection<RentalRequest> RentalRequestRenters { get; set; } = new List<RentalRequest>();

    public virtual ICollection<RentalRequest> RentalRequestReviewedByNavigations { get; set; } = new List<RentalRequest>();

    public virtual Role Role { get; set; } = null!;

    public virtual ICollection<Warehouse> WarehouseApprovedByNavigations { get; set; } = new List<Warehouse>();

    public virtual ICollection<WarehouseDocument> WarehouseDocuments { get; set; } = new List<WarehouseDocument>();

    public virtual ICollection<Warehouse> WarehouseOwners { get; set; } = new List<Warehouse>();
    
    public ICollection<WarehouseMembership> WarehouseMemberships { get; set; } = new List<WarehouseMembership>();
}
