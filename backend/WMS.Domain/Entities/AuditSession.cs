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

    public virtual User CreatedByNavigation { get; set; } = null!;

    public virtual Warehouse Warehouse { get; set; } = null!;
}
