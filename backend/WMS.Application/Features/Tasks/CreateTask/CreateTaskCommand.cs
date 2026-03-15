using MediatR;

namespace WMS.Application.Features.Tasks.CreateTask;

public class CreateTaskCommand : IRequest<int>
{
    public int WarehouseId { get; set; }
    public int CallerId { get; set; }
    public int TaskTypeId { get; set; }
    public bool IsAllZone { get; set; }
    public List<int> ZoneIds { get; set; } = new();
    public string? Note { get; set; }
    public DateTime? ScheduledAt { get; set; }
}

public class CreateTaskDto
{
    public int WarehouseId { get; set; }
    public int TaskTypeId { get; set; }
    public bool IsAllZone { get; set; }
    public List<int> ZoneIds { get; set; } = new();
    public string? Note { get; set; }
    public DateTime? ScheduledAt { get; set; }
}
