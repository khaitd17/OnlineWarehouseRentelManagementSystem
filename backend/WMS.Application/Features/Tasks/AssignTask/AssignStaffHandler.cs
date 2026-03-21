using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Tasks.AssignTask;

public class AssignStaffHandler : IRequestHandler<AssignStaffCommand, Unit>
{
    private readonly ITaskRepository _repo;
    private readonly IStaffMembershipRepository _membershipRepo;

    public AssignStaffHandler(ITaskRepository repo, IStaffMembershipRepository membershipRepo)
    {
        _repo = repo;
        _membershipRepo = membershipRepo;
    }

    public async Task<Unit> Handle(AssignStaffCommand cmd, CancellationToken ct)
    {
        var warehouseId = await _repo.GetTaskWarehouseIdAsync(cmd.TaskId, ct)
            ?? throw new KeyNotFoundException($"Task {cmd.TaskId} không tồn tại.");

        var caller = await _membershipRepo.GetCallerMembershipAsync(cmd.CallerId, warehouseId, ct)
            ?? throw new UnauthorizedAccessException("Bạn không có quyền trong kho này.");

        if (caller.RoleCode != "OPERATOR" && caller.RoleCode != "MANAGER")
            throw new UnauthorizedAccessException("Chỉ OPERATOR hoặc MANAGER mới được gán nhân viên.");

        await _repo.AssignStaffAsync(cmd.TaskId, cmd.MembershipIds, ct);
        return Unit.Value;
    }
}

public class GetEligibleStaffHandler : IRequestHandler<GetEligibleStaffQuery, List<EligibleStaffResult>>
{
    private readonly ITaskRepository _repo;
    private readonly IStaffMembershipRepository _membershipRepo;

    public GetEligibleStaffHandler(ITaskRepository repo, IStaffMembershipRepository membershipRepo)
    {
        _repo = repo;
        _membershipRepo = membershipRepo;
    }

    public async Task<List<EligibleStaffResult>> Handle(GetEligibleStaffQuery query, CancellationToken ct)
    {
        var warehouseId = await _repo.GetTaskWarehouseIdAsync(query.TaskId, ct)
            ?? throw new KeyNotFoundException($"Task {query.TaskId} không tồn tại.");

        var caller = await _membershipRepo.GetCallerMembershipAsync(query.CallerId, warehouseId, ct)
            ?? throw new UnauthorizedAccessException("Bạn không có quyền trong kho này.");

        if (caller.RoleCode != "OPERATOR" && caller.RoleCode != "MANAGER")
            throw new UnauthorizedAccessException("Chỉ OPERATOR hoặc MANAGER mới được xem danh sách nhân viên.");

        var staff = await _repo.GetEligibleStaffAsync(query.TaskId, query.CallerId, ct);

        return staff.Select(s => new EligibleStaffResult
        {
            MembershipId = s.MembershipId,
            FullName     = s.FullName,
            Email        = s.Email,
            RoleCode     = s.RoleCode,
            Skills       = s.Skills,
        }).ToList();
    }
}
