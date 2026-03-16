using MediatR;

namespace WMS.Application.Features.Tasks.GetTaskTypes;

public class GetTaskTypesQuery : IRequest<List<TaskTypeResult>>
{
}

public class TaskTypeResult
{
    public int Id { get; set; }
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public bool IsAllSkill { get; set; }
}
