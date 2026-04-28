using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Tasks.GetTasks;

public class GetTasksHandler : IRequestHandler<GetTasksQuery, List<TaskDto>>
{
    private readonly ITaskRepository _repo;
    private readonly IStaffMembershipRepository _membershipRepo;

    public GetTasksHandler(ITaskRepository repo, IStaffMembershipRepository membershipRepo)
    {
        _repo = repo;
        _membershipRepo = membershipRepo;
    }

    public async Task<List<TaskDto>> Handle(GetTasksQuery request, CancellationToken ct)
    {
        
        bool IsManager  = await _membershipRepo.HasRoleAsync(request.CallerId, request.WarehouseId, "MANAGER",  ct);
        bool IsOperator = await _membershipRepo.HasRoleAsync(request.CallerId, request.WarehouseId, "OPERATOR", ct);
        if(!IsManager&&!IsOperator)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền trong kho này.");
        }
        return await _repo.GetTasksAsync(request.WarehouseId, request.StartDate, request.EndDate, isManualOnly: false, ct);
    }
}
