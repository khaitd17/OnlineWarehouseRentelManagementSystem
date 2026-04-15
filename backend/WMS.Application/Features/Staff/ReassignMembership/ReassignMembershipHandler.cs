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
        var target = await _repo.GetMembershipByIdAsync(cmd.TargetMembershipId, ct)
            ?? throw new KeyNotFoundException($"Membership {cmd.TargetMembershipId} không tồn tại.");

        // Dùng HasRoleAsync để tránh bug priority khi user có cả OWNER+OPERATOR
        bool callerIsOperator = await _repo.HasRoleAsync(cmd.CallerId, target.WarehouseId, "OPERATOR", ct);
        bool callerIsManager  = await _repo.HasRoleAsync(cmd.CallerId, target.WarehouseId, "MANAGER",  ct);

        if (!callerIsOperator && !callerIsManager)
            throw new UnauthorizedAccessException("Bạn không có quyền trong kho này.");

        // ── Bước 2: Xác định callerRoleCode cho phân nhánh scope ─────────────
        // Nếu có cả OPERATOR lẫn MANAGER → ưu tiên OPERATOR (quyền cao hơn)
        string callerRoleCode = callerIsOperator ? "OPERATOR" : "MANAGER";

        // ── Bước 3: Kiểm tra quyền tạo / cập nhật ───────────────────────────
        // MANAGER chỉ được cập nhật STAFF, không được đổi thành MANAGER hoặc OPERATOR
        if (callerRoleCode == "MANAGER" && cmd.TargetRoleCode != "STAFF")
            throw new UnauthorizedAccessException("Manager chỉ được phép phân quyền nhân viên cấp STAFF.");

        // MANAGER không được set IsAllSkill
        if (callerRoleCode == "MANAGER" && cmd.IsAllSkill)
            throw new UnauthorizedAccessException("Manager không được cấp quyền 'tất cả skill'.");

        // ── Bước 4: Validate scope của MANAGER ───────────────────────────────
        if (callerRoleCode == "MANAGER")
        {
            // Lấy membership của caller để check skill scope
            var callerMembership = await _repo.GetMembershipByRoleAsync(cmd.CallerId, target.WarehouseId, "MANAGER", ct);
            if (callerMembership != null && !callerMembership.IsAllSkill &&
                cmd.SkillIds.Any(id => !callerMembership.SkillIds.Contains(id)))
                throw new UnauthorizedAccessException("Bạn đang gán skill nằm ngoài phạm vi quản lý của mình.");
        }

        // ── Bước 4: Cập nhật membership ──────────────────────────────────────
        await _repo.ReassignMembershipAsync(new ReassignMembershipDto
        {
            MembershipId   = cmd.TargetMembershipId,
            TargetRoleCode = cmd.TargetRoleCode,
            IsAllSkill     = cmd.IsAllSkill,
            SkillIds       = cmd.IsAllSkill ? new() : cmd.SkillIds,
        }, ct);

        return Unit.Value;
    }
}
