using System;
using System.Collections.Generic;

namespace WMS.Domain.Entities;

public partial class WmsTask
{
    public int TaskId { get; set; }

    public int WarehouseId { get; set; }

    public int? AssigneeId { get; set; }

    public int CreatedBy { get; set; }

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public string? Status { get; set; }

    public string? Priority { get; set; }

    public DateTime? Deadline { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public virtual User? Assignee { get; set; }

    public virtual User CreatedByNavigation { get; set; } = null!;

    public virtual Warehouse Warehouse { get; set; } = null!;
}
