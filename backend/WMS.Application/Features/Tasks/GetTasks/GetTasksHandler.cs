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
        var caller = await _membershipRepo.GetCallerMembershipAsync(request.CallerId, request.WarehouseId, ct)
            ?? throw new UnauthorizedAccessException("Bạn không có quyền trong kho này.");

        var allowedRoles = new[] { "MANAGER", "OPERATOR" };
        if (!allowedRoles.Contains(caller.RoleCode))
            throw new UnauthorizedAccessException("Chỉ Manager/Operator mới có quyền xem task.");

        return await _repo.GetTasksAsync(request.WarehouseId, request.StartDate, request.EndDate, isManualOnly: true, ct);
    }
}
