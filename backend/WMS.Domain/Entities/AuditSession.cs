using System;
using System.Collections.Generic;

namespace WMS.Domain.Entities;

public partial class AuditSession
{
    public int AuditId { get; set; }

    public int WarehouseId { get; set; }

    public int CreatedBy { get; set; }

    public string? Status { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public string? Notes { get; set; }

    public int? AssignedTo { get; set; }

    public virtual ICollection<AuditResult> AuditResults { get; set; } = new List<AuditResult>();

    public virtual User CreatedByNavigation { get; set; } = null!;

    public virtual User? AssignedToNavigation { get; set; }

    public virtual Warehouse Warehouse { get; set; } = null!;
}
