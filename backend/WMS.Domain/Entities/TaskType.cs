using System.Collections.Generic;

namespace WMS.Domain.Entities;

public class TaskType
{
    public int Id { get; set; }
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public bool IsAllSkill { get; set; } = false;
    public bool IsManual   { get; set; } = false;   
    public int? SkillId { get; set; }
    public Skill? Skill { get; set; }
    public ICollection<WarehouseTask> Tasks { get; set; } = new List<WarehouseTask>();
}
