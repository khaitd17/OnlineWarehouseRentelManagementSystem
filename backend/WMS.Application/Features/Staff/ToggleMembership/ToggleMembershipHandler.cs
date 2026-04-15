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

        // Dùng HasRoleAsync thay GetCallerMembership — tránh bug priority khi user có cả OWNER+OPERATOR
        bool callerIsOperator = await _repo.HasRoleAsync(cmd.CallerId, target.WarehouseId, "OPERATOR", ct);
        bool callerIsManager  = await _repo.HasRoleAsync(cmd.CallerId, target.WarehouseId, "MANAGER",  ct);

        if (!callerIsOperator && !callerIsManager)
            throw new UnauthorizedAccessException("Chỉ OPERATOR hoặc MANAGER mới được thực hiện thao tác này.");

        if (!callerIsOperator && callerIsManager && target.RoleCode != "STAFF")
            throw new UnauthorizedAccessException("Manager chỉ được phép thay đổi trạng thái nhân viên cấp STAFF.");

        // MANAGER chỉ được toggle STAFF nằm trong phạm vi skill của mình
        if (!callerIsOperator && callerIsManager)
        {
            var inScope = (await _repo.GetByWarehouseAsync(target.WarehouseId, null, 1, 1, cmd.CallerId, ct))
                .Items.Any(m => m.MembershipId == cmd.MembershipId);
            if (!inScope)
                throw new UnauthorizedAccessException("Nhân viên này không thuộc phạm vi quản lý của bạn.");
        }

        await _repo.SetActiveAsync(cmd.MembershipId, cmd.SetActive, ct);
        return Unit.Value;
    }
}
