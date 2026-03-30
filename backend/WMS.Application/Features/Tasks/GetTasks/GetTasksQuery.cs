using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Tasks.GetTasks;

public class GetTasksQuery : IRequest<List<TaskDto>>
{
    public int WarehouseId { get; set; }
    public int CallerId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}
