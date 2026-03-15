using MediatR;
using WMS.Application.Interfaces;

namespace WMS.Application.Features.Tasks.GetTaskTypes;

public class GetTaskTypesHandler : IRequestHandler<GetTaskTypesQuery, List<TaskTypeResult>>
{
    private readonly ITaskRepository _repo;

    public GetTaskTypesHandler(ITaskRepository repo) => _repo = repo;

    public async Task<List<TaskTypeResult>> Handle(GetTaskTypesQuery query, CancellationToken ct)
    {
        var types = await _repo.GetTaskTypesAsync(ct);
        return types.Select(t => new TaskTypeResult
        {
            Id          = t.Id,
            Code        = t.Code,
            Name        = t.Name,
            Description = t.Description,
            IsAllSkill  = t.IsAllSkill,
        }).ToList();
    }
}
