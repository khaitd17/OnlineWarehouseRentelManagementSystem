using System;

namespace WMS.Domain.Entities;

public class EquipmentHistory
{
    public int Id { get; set; }
    public int EquipmentId { get; set; }
    public string? PreviousStatus { get; set; }
    public string? NewStatus { get; set; }
    public int? PreviousRentalAreaId { get; set; }
    public int? NewRentalAreaId { get; set; }
    public int? ContractId { get; set; } // Link to rental if applicable
    public int? ChangedBy { get; set; } // UserID
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual Equipment Equipment { get; set; } = null!;
    public virtual Contract? Contract { get; set; }
}
