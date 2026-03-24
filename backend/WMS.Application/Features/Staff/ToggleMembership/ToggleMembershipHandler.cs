using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Staff.ToggleMembership;

public class ToggleMembershipHandler : IRequestHandler<ToggleMembershipCommand, Unit>
{
    private readonly IStaffMembershipRepository _repo;

    public ToggleMembershipHandler(IStaffMembershipRepository repo) => _repo = repo;

    public async Task<Unit> Handle(ToggleMembershipCommand cmd, CancellationToken ct)
    {
        var target = await _repo.GetMembershipByIdAsync(cmd.MembershipId, ct)
            ?? throw new KeyNotFoundException($"Membership {cmd.MembershipId} không tồn tại.");

        var caller = await _repo.GetCallerMembershipAsync(cmd.CallerId, target.WarehouseId, ct)
            ?? throw new UnauthorizedAccessException("Bạn không có quyền trong kho này.");

        if (caller.RoleCode != "OPERATOR" && caller.RoleCode != "MANAGER")
            throw new UnauthorizedAccessException("Chỉ OPERATOR hoặc MANAGER mới được thực hiện thao tác này.");

        if (caller.RoleCode == "MANAGER" && target.RoleCode != "STAFF")
            throw new UnauthorizedAccessException("Manager chỉ được phép thay đổi trạng thái nhân viên cấp STAFF.");

        // MANAGER chỉ được toggle STAFF nằm trong phạm vi skill của mình
        if (caller.RoleCode == "MANAGER")
        {
            var inScope = caller.IsAllSkill ||
                (await _repo.GetByWarehouseAsync(target.WarehouseId, null, 1, 1, cmd.CallerId, ct))
                    .Items.Any(m => m.MembershipId == cmd.MembershipId);

            if (!inScope)
                throw new UnauthorizedAccessException("Nhân viên này không thuộc phạm vi quản lý của bạn.");
        }

        await _repo.SetActiveAsync(cmd.MembershipId, cmd.SetActive, ct);
        return Unit.Value;
    }
}
