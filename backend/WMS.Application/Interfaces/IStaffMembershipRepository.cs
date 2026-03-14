using WMS.Application.Features.Staff.CreateStaff;
using WMS.Application.Features.Staff.ListStaff;
using WMS.Domain.Entities;

namespace WMS.Application.Interfaces;

public interface IStaffMembershipRepository
{
    Task<StaffMembershipPagedResult> GetByWarehouseAsync(
        int warehouseId,
        string? search,
        int page,
        int pageSize,
        CancellationToken ct = default);

    Task SetActiveAsync(int membershipId, bool isActive, CancellationToken ct = default);

    /// <summary>
    /// Lấy membership của một user trong một kho cụ thể.
    /// Trả về null nếu user không có membership hoặc membership không active.
    /// </summary>
    Task<CallerMembershipDto?> GetCallerMembershipAsync(int userId, int warehouseId, CancellationToken ct = default);

    /// <summary>
    /// Tạo WarehouseMembership mới với skills và zones.
    /// </summary>
    Task<int> CreateMembershipAsync(CreateMembershipDto dto, CancellationToken ct = default);

    /// <summary>
    /// Lấy danh sách các kho mà user có role OPERATOR hoặc MANAGER (membership active).
    /// </summary>
    Task<List<ManagedWarehouseDto>> GetManagedWarehousesAsync(int userId, CancellationToken ct = default);

    /// <summary>
    /// Lấy thông tin cơ bản của một membership (bao gồm warehouseId) theo ID.
    /// Dùng trong Reassign để xác định kho của target membership.
    /// </summary>
    Task<MembershipInfoDto?> GetMembershipByIdAsync(int membershipId, CancellationToken ct = default);

    /// <summary>
    /// Cập nhật role, skills và zones của một membership hiện có.
    /// </summary>
    Task ReassignMembershipAsync(ReassignMembershipDto dto, CancellationToken ct = default);
}

/// <summary>DTO thể hiện membership và quyền của người đang thao tác (caller).</summary>
public class CallerMembershipDto
{
    public int MembershipId { get; set; }
    public string RoleCode { get; set; } = null!;
    public bool IsAllSkill { get; set; }
    public bool IsAllZone { get; set; }
    public List<int> SkillIds { get; set; } = new();
    public List<int> ZoneIds { get; set; } = new();
}

/// <summary>DTO để tạo membership mới.</summary>
public class CreateMembershipDto
{
    public int UserId { get; set; }
    public int WarehouseId { get; set; }
    public string RoleCode { get; set; } = null!;
    public bool IsAllSkill { get; set; }
    public bool IsAllZone { get; set; }
    public List<int> SkillIds { get; set; } = new();
    public List<int> ZoneIds { get; set; } = new();
}

/// <summary>Thông tin cơ bản của một membership.</summary>
public class MembershipInfoDto
{
    public int MembershipId { get; set; }
    public int WarehouseId { get; set; }
    public int UserId { get; set; }
    public string RoleCode { get; set; } = null!;
}

/// <summary>DTO để cập nhật (reassign) một membership.</summary>
public class ReassignMembershipDto
{
    public int MembershipId { get; set; }
    public string TargetRoleCode { get; set; } = null!;
    public bool IsAllSkill { get; set; }
    public bool IsAllZone { get; set; }
    public List<int> SkillIds { get; set; } = new();
    public List<int> ZoneIds { get; set; } = new();
}
