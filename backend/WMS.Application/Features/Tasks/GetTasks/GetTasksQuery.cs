using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Tasks.GetTasks;

public class GetTasksQuery : IRequest<TaskListResult>
{
    public int WarehouseId { get; set; }
    public int CallerId { get; set; }
    public DateTime? WeekStart { get; set; }
}
