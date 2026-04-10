using MediatR;

namespace WMS.Application.Features.Tasks.CreateTask;

public class CreateTaskCommand : IRequest<int>
{
    public int CallerId    { get; set; }
    public int WarehouseId { get; set; }
    public int TaskTypeId  { get; set; }
    public string? Note    { get; set; }
    public DateTime? ScheduledAt { get; set; }
}
