using System;
using System.Collections.Generic;

namespace WMS.Domain.Entities;

public class WarehouseTask
{
    public int Id { get; set; }
    public int WarehouseId { get; set; }
    public int TaskTypeId { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ScheduledAt { get; set; }
    public string? Note { get; set; }
    public bool IsAllZone { get; set; } = false;
    public Warehouse Warehouse { get; set; } = null!;
    public TaskType TaskType { get; set; } = null!;
    public ICollection<Zone> Zones { get; set; } = new List<Zone>();
    public ICollection<TaskAssignment> Assignments { get; set; } = new List<TaskAssignment>();
}
