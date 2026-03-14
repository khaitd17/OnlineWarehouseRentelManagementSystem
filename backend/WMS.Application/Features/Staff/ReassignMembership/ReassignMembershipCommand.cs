using MediatR;

namespace WMS.Application.Features.Staff.ReassignMembership;

/// <summary>
/// Command để cập nhật role, skills, và zones của một membership.
/// Caller phải là OPERATOR hoặc MANAGER và không thể vượt phạm vi quyền của mình.
/// </summary>
public class ReassignMembershipCommand : IRequest<Unit>
{
    /// <summary>ID của người gọi API (từ JWT).</summary>
    public int CallerId { get; set; }

    /// <summary>ID của membership cần cập nhật.</summary>
    public int TargetMembershipId { get; set; }

    /// <summary>Role mới muốn gán: "MANAGER" hoặc "STAFF".</summary>
    public string TargetRoleCode { get; set; } = null!;

    /// <summary>Skills mới (IDs). Bỏ qua nếu IsAllSkill = true.</summary>
    public List<int> SkillIds { get; set; } = new();

    /// <summary>Zones mới (IDs). Bỏ qua nếu IsAllZone = true.</summary>
    public List<int> ZoneIds { get; set; } = new();

    /// <summary>Chỉ OPERATOR mới được set true.</summary>
    public bool IsAllSkill { get; set; }

    /// <summary>Chỉ OPERATOR mới được set true.</summary>
    public bool IsAllZone { get; set; }
}
