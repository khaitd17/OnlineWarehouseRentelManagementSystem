using System;

namespace WMS.Domain.Entities;

public class EquipmentIncidentComment
{
    public int Id { get; set; }
    public int IncidentId { get; set; }
    public int UserId { get; set; }
    public string Content { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual EquipmentIncident Incident { get; set; } = null!;
    public virtual User User { get; set; } = null!;
}
