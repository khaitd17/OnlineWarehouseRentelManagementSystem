using System;
using System.Collections.Generic;

namespace WMS.Domain.Entities;

public class TaskType
{
    public int Id { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public ICollection<Skill> RequiredSkills { get; set; } = new List<Skill>();

    public ICollection<WarehouseTask> Tasks { get; set; } = new List<WarehouseTask>();
}
