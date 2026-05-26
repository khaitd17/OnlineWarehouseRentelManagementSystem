using MediatR;
using System.Security;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Staff.SetStaffShift;

public class SetStaffShiftHandler : IRequestHandler<SetStaffShiftCommand, Unit>
{
    private readonly IStaffMembershipRepository _repo;

    public SetStaffShiftHandler(IStaffMembershipRepository repo)
    {
        _repo = repo;
    }

    public async Task<Unit> Handle(SetStaffShiftCommand cmd, CancellationToken ct)
    {
        var target = await _repo.GetMembershipByIdAsync(cmd.MembershipId, ct)
            ?? throw new KeyNotFoundException($"Membership {cmd.MembershipId} không tồn tại.");

        bool callerIsOperator = await _repo.HasRoleAsync(cmd.CallerId, target.WarehouseId, "OPERATOR", ct);
        bool callerIsManager  = await _repo.HasRoleAsync(cmd.CallerId, target.WarehouseId, "MANAGER",  ct);
        bool callerIsOwner    = await _repo.HasRoleAsync(cmd.CallerId, target.WarehouseId, "OWNER", ct);

        if (!callerIsOwner && !callerIsOperator && !callerIsManager)
            throw new UnauthorizedAccessException("Bạn không có quyền quản lý ca làm trong kho này.");

        if (!callerIsOwner && !callerIsOperator && callerIsManager && target.RoleCode != "STAFF")
            throw new UnauthorizedAccessException("Manager chỉ được phép cấu hình ca cho nhân viên cấp STAFF.");

        await _repo.SetWarehouseShiftAsync(cmd.MembershipId, cmd.WarehouseShiftId, ct);

        return Unit.Value;
    }
}
