namespace WMS.Domain.Interfaces;

public interface IStaffMembershipRepository
{
    Task<StaffMembershipPagedResult> GetByWarehouseAsync(
        int warehouseId,
        string? search,
        int page,
        int pageSize,
        int? callerId = null,
        CancellationToken ct = default);

    Task SetActiveAsync(int membershipId, bool isActive, CancellationToken ct = default);

    Task<CallerMembershipDto?> GetCallerMembershipAsync(int userId, int warehouseId, CancellationToken ct = default);

    Task<int> CreateMembershipAsync(CreateMembershipDto dto, CancellationToken ct = default);

    Task<List<ManagedWarehouseDto>> GetManagedWarehousesAsync(int userId, CancellationToken ct = default);

    Task<MembershipInfoDto?> GetMembershipByIdAsync(int membershipId, CancellationToken ct = default);

    Task ReassignMembershipAsync(ReassignMembershipDto dto, CancellationToken ct = default);
    Task SetWarehouseShiftAsync(int membershipId, int? warehouseShiftId, CancellationToken ct = default);

    Task<List<ManagerScopeDto>> GetActiveManagersInWarehouseAsync(int warehouseId, CancellationToken ct = default);

    Task<List<WarehouseNotificationRecipientDto>> GetActiveWarehouseNotificationRecipientsAsync(
        int warehouseId,
        CancellationToken ct = default);

    Task<List<MyWarehouseItemDto>> GetMyWarehousesAsync(int userId, CancellationToken ct = default);

    Task<List<SkillDto>> GetSkillsAsync(CancellationToken ct = default);

    Task<bool> HasRoleAsync(int userId, int warehouseId, string roleCode, CancellationToken ct = default);
    Task<CallerMembershipDto?> GetMembershipByRoleAsync(int userId, int warehouseId, string roleCode, CancellationToken ct = default);
}

public class StaffMembershipDto
{
    public int MembershipId { get; set; }
    public int UserId { get; set; }
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Phone { get; set; }
    public string? UserStatus { get; set; }
    public bool MembershipIsActive { get; set; }
    public string RoleCode { get; set; } = null!;
    public string RoleName { get; set; } = null!;
    public bool IsAllSkill { get; set; }
    public List<SkillDto> Skills { get; set; } = new();
    public int? WarehouseShiftId { get; set; }
    public string? WarehouseShiftName { get; set; }
}

public class SkillDto
{
    public int Id { get; set; }
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
}

public class StaffMembershipPagedResult
{
    public int WarehouseId { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int Total { get; set; }
    public int TotalPages { get; set; }
    public List<StaffMembershipDto> Items { get; set; } = new();
}

public class CallerMembershipDto
{
    public int MembershipId { get; set; }
    public string RoleCode { get; set; } = null!;  // Role cao nhất (theo priority)
    public bool IsAllSkill { get; set; }
    public List<int> SkillIds { get; set; } = new();
    /// <summary>Skill codes (e.g. "CHECKER", "INVENTORY_OPERATOR") — populated by GetCallerMembershipAsync.</summary>
    public List<string> SkillCodes { get; set; } = new();
    /// <summary>Tất cả role codes user có trong kho này (ví dụ ["OWNER","OPERATOR"]). Dùng để check quyền chính xác.</summary>
    public List<string> AllRoleCodes { get; set; } = new();

    /// <summary>True nếu user có skill cụ thể hoặc IsAllSkill.</summary>
    public bool HasSkill(string skillCode) =>
        IsAllSkill || SkillCodes.Contains(skillCode, StringComparer.OrdinalIgnoreCase);

    /// <summary>True nếu user có role cụ thể trong kho (kể cả khi không phải role cao nhất).</summary>
    public bool HasRole(string roleCode) =>
        AllRoleCodes.Contains(roleCode, StringComparer.OrdinalIgnoreCase);
}

public class CreateMembershipDto
{
    public int UserId { get; set; }
    public int WarehouseId { get; set; }
    public string RoleCode { get; set; } = null!;
    public bool IsAllSkill { get; set; }
    public List<int> SkillIds { get; set; } = new();
    public int? WarehouseShiftId { get; set; }  // null = ca xoay (rotating)
}

public class MembershipInfoDto
{
    public int MembershipId { get; set; }
    public int WarehouseId { get; set; }
    public int UserId { get; set; }
    public string RoleCode { get; set; } = null!;
}

public class ManagedWarehouseDto
{
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = null!;
    public string RoleCode { get; set; } = null!;
}

public class MyWarehouseItemDto
{
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = null!;
    public string RoleCode { get; set; } = null!;
    public bool HasZone { get; set; }
}

public class ReassignMembershipDto
{
    public int MembershipId { get; set; }
    public string TargetRoleCode { get; set; } = null!;
    public bool IsAllSkill { get; set; }
    public List<int> SkillIds { get; set; } = new();
}

public class ManagerScopeDto
{
    public int MembershipId { get; set; }
    public string FullName { get; set; } = null!;
    public bool IsAllSkill { get; set; }
    public List<int> SkillIds { get; set; } = new();
}

public class WarehouseNotificationRecipientDto
{
    public int UserId { get; set; }
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string RoleCode { get; set; } = null!;
}

// ZoneDto kept for potential use in other non-staff features
public class ZoneDto
{
    public int Id { get; set; }
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
}
