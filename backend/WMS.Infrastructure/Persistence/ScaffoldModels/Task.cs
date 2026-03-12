using System;
using System.Collections.Generic;

namespace WMS.Infrastructure.Persistence.ScaffoldModels;

public partial class Task
{
    public int Id { get; set; }

    public int WarehouseId { get; set; }

    public int TaskTypeId { get; set; }

    public string Status { get; set; } = "Pending";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Warehouse Warehouse { get; set; } = null!;

    public TaskType TaskType { get; set; } = null!;

    public ICollection<TaskAssignment> Assignments { get; set; } = new List<TaskAssignment>();
}
