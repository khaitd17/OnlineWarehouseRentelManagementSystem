using System;
using System.Collections.Generic;

namespace WMS.Domain.Entities;

public class EquipmentIncident
{
    public int Id { get; set; }
    public int EquipmentId { get; set; }
    public int WarehouseId { get; set; }
    public int ReportedById { get; set; }
    public string Title { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string Severity { get; set; } = "MEDIUM"; // LOW, MEDIUM, HIGH
    public string Status { get; set; } = "OPEN"; // OPEN, IN_PROGRESS, RESOLVED, CLOSED
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }

    public virtual Equipment Equipment { get; set; } = null!;
    public virtual Warehouse Warehouse { get; set; } = null!;
    public virtual User ReportedBy { get; set; } = null!;
    public virtual ICollection<EquipmentIncidentComment> Comments { get; set; } = new List<EquipmentIncidentComment>();
    public virtual ICollection<EquipmentIncidentAttachment> Attachments { get; set; } = new List<EquipmentIncidentAttachment>();
}
