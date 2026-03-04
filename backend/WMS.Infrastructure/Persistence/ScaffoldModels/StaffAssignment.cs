using System;
using System.Collections.Generic;

namespace WMS.Infrastructure.Persistence.ScaffoldModels;

public partial class StaffAssignment
{
    public int AssignmentId { get; set; }

    public int StaffId { get; set; }

    public int WarehouseId { get; set; }

    public string? Status { get; set; }

    public DateTime? AssignedAt { get; set; }

    public DateOnly? EndDate { get; set; }

    public string? Notes { get; set; }

    public virtual User Staff { get; set; } = null!;

    public virtual Warehouse Warehouse { get; set; } = null!;
}
