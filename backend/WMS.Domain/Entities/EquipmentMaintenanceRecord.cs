using System;

namespace WMS.Domain.Entities;

public class EquipmentMaintenanceRecord
{
    public int Id { get; set; }
    public int EquipmentId { get; set; }
    public DateTime? MaintenanceDate { get; set; }
    public string? MaintenanceType { get; set; } // Periodic, Repair, Emergency
    public string? Description { get; set; }
    public decimal? TotalCost { get; set; }
    public string? PerformedBy { get; set; }
    public string? ResolutionStatus { get; set; } // SUCCESS, PARTIAL, FAILED
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual Equipment Equipment { get; set; } = null!;
}
