using System;

namespace WMS.Domain.Entities;

public class EquipmentIncidentAttachment
{
    public int Id { get; set; }
    public int IncidentId { get; set; }
    public string FileUrl { get; set; } = null!;
    public string? FileType { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual EquipmentIncident Incident { get; set; } = null!;
}
