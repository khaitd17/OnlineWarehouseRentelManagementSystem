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

    Task<List<ManagerScopeDto>> GetActiveManagersInWarehouseAsync(int warehouseId, CancellationToken ct = default);
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
    public string RoleCode { get; set; } = null!;
    public bool IsAllSkill { get; set; }
    public List<int> SkillIds { get; set; } = new();
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

// ZoneDto kept for potential use in other non-staff features
public class ZoneDto
{
    public int Id { get; set; }
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
}
