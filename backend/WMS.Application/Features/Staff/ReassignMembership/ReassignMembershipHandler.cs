using MediatR;
using System.Security;
using WMS.Application.Interfaces;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Staff.ReassignMembership;

public class ReassignMembershipHandler : IRequestHandler<ReassignMembershipCommand, Unit>
{
    private readonly IStaffMembershipRepository _repo;

    public ReassignMembershipHandler(IStaffMembershipRepository repo)
    {
        _repo = repo;
    }

    public async Task<Unit> Handle(ReassignMembershipCommand cmd, CancellationToken ct)
    {
        // ── Bước 1: Lấy membership của caller để kiểm tra quyền ──────────────
        // Trước tiên cần lấy warehouseId từ target membership
        var target = await _repo.GetMembershipByIdAsync(cmd.TargetMembershipId, ct)
            ?? throw new KeyNotFoundException($"Membership {cmd.TargetMembershipId} không tồn tại.");

        var caller = await _repo.GetCallerMembershipAsync(cmd.CallerId, target.WarehouseId, ct)
            ?? throw new UnauthorizedAccessException("Bạn không có quyền trong kho này.");

        // ── Bước 2: Kiểm tra quyền tạo / cập nhật ───────────────────────────
        if (caller.RoleCode != "OPERATOR" && caller.RoleCode != "MANAGER")
            throw new UnauthorizedAccessException("Chỉ OPERATOR hoặc MANAGER mới được cập nhật phân quyền.");

        // MANAGER chỉ được cập nhật STAFF, không được đổi thành MANAGER hoặc OPERATOR
        if (caller.RoleCode == "MANAGER" && cmd.TargetRoleCode != "STAFF")
            throw new UnauthorizedAccessException("Manager chỉ được phép phân quyền nhân viên cấp STAFF.");

        // MANAGER không được set IsAllSkill / IsAllZone
        if (caller.RoleCode == "MANAGER" && (cmd.IsAllSkill || cmd.IsAllZone))
            throw new UnauthorizedAccessException("Manager không được cấp quyền 'tất cả skill/zone'.");

        // ── Bước 3: Validate scope của MANAGER ───────────────────────────────
        if (caller.RoleCode == "MANAGER")
        {
            if (!caller.IsAllSkill && cmd.SkillIds.Any(id => !caller.SkillIds.Contains(id)))
                throw new UnauthorizedAccessException("Bạn đang gán skill nằm ngoài phạm vi quản lý của mình.");

            if (!caller.IsAllZone && cmd.ZoneIds.Any(id => !caller.ZoneIds.Contains(id)))
                throw new UnauthorizedAccessException("Bạn đang gán zone nằm ngoài phạm vi quản lý của mình.");
        }

        // ── Bước 4: Cập nhật membership ──────────────────────────────────────
        await _repo.ReassignMembershipAsync(new ReassignMembershipDto
        {
            MembershipId   = cmd.TargetMembershipId,
            TargetRoleCode = cmd.TargetRoleCode,
            IsAllSkill     = cmd.IsAllSkill,
            IsAllZone      = cmd.IsAllZone,
            SkillIds       = cmd.IsAllSkill ? new() : cmd.SkillIds,
            ZoneIds        = cmd.IsAllZone  ? new() : cmd.ZoneIds,
        }, ct);

        return Unit.Value;
    }
}
