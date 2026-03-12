using System;
using System.Collections.Generic;

namespace WMS.Domain.Entities;

public class TaskAssignment
{
    public int Id { get; set; }

    public int TaskId { get; set; }

    public int MembershipId { get; set; }

    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    public DateTime? CompletedAt { get; set; }

    public string Status { get; set; } = "Assigned";

    public WarehouseTask Task { get; set; } = null!;

    public WarehouseMembership Membership { get; set; } = null!;
}
