namespace WMS.Application.Features.Staff.ListStaff;

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
    public bool IsAllZone { get; set; }

    public List<SkillDto> Skills { get; set; } = new();
    public List<ZoneDto> Zones { get; set; } = new();
}

public class SkillDto
{
    public int Id { get; set; }
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
}

public class ZoneDto
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
