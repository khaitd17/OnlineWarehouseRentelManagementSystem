using Microsoft.EntityFrameworkCore;
using WMS.Application.Features.Staff.ListStaff;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Repositories;

public class StaffMembershipRepository : IStaffMembershipRepository
{
    private readonly ApplicationDbContext _db;

    public StaffMembershipRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    // ── GetByWarehouseAsync ────────────────────────────────────────────────
    public async Task<StaffMembershipPagedResult> GetByWarehouseAsync(
        int warehouseId,
        string? search,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        var query = _db.WarehouseMemberships
            .Where(m => m.WarehouseId == warehouseId)
            .Include(m => m.User)
            .Include(m => m.Role)
            .Include(m => m.Skills)
            .Include(m => m.Zones)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(m =>
                m.User.FullName.ToLower().Contains(s) ||
                m.User.Email.ToLower().Contains(s));
        }

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderBy(m => m.Role.Code)
            .ThenBy(m => m.User.FullName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var dtos = items.Select(m => new StaffMembershipDto
        {
            MembershipId       = m.Id,
            UserId             = m.UserId,
            FullName           = m.User.FullName,
            Email              = m.User.Email,
            Phone              = m.User.Phone,
            UserStatus         = m.User.Status,
            MembershipIsActive = m.IsActive,
            RoleCode           = m.Role.Code,
            RoleName           = m.Role.Name,
            IsAllSkill         = m.IsAllSkill,
            IsAllZone          = m.IsAllZone,
            Skills             = m.Skills.Select(s => new SkillDto { Id = s.Id, Code = s.Code, Name = s.Name }).ToList(),
            Zones              = m.Zones.Select(z => new ZoneDto  { Id = z.Id, Code = z.Code, Name = z.Name }).ToList()
        }).ToList();

        return new StaffMembershipPagedResult
        {
            WarehouseId = warehouseId,
            Page        = page,
            PageSize    = pageSize,
            Total       = total,
            TotalPages  = (int)Math.Ceiling((double)total / pageSize),
            Items       = dtos
        };
    }

    // ── SetActiveAsync ────────────────────────────────────────────────────
    public async Task SetActiveAsync(int membershipId, bool isActive, CancellationToken ct = default)
    {
        var membership = await _db.WarehouseMemberships
            .FirstOrDefaultAsync(m => m.Id == membershipId, ct)
            ?? throw new KeyNotFoundException($"Membership {membershipId} không tồn tại.");

        membership.IsActive = isActive;
        await _db.SaveChangesAsync(ct);
    }

    // ── GetCallerMembershipAsync ──────────────────────────────────────────
    public async Task<CallerMembershipDto?> GetCallerMembershipAsync(
        int userId,
        int warehouseId,
        CancellationToken ct = default)
    {
        var m = await _db.WarehouseMemberships
            .Where(x => x.UserId == userId && x.WarehouseId == warehouseId && x.IsActive)
            .Include(x => x.Role)
            .Include(x => x.Skills)
            .Include(x => x.Zones)
            .FirstOrDefaultAsync(ct);

        if (m == null) return null;

        return new CallerMembershipDto
        {
            MembershipId = m.Id,
            RoleCode     = m.Role.Code,
            IsAllSkill   = m.IsAllSkill,
            IsAllZone    = m.IsAllZone,
            SkillIds     = m.Skills.Select(s => s.Id).ToList(),
            ZoneIds      = m.Zones.Select(z => z.Id).ToList(),
        };
    }

    // ── CreateMembershipAsync ──────────────────────────────────────────────
    public async Task<int> CreateMembershipAsync(CreateMembershipDto dto, CancellationToken ct = default)
    {
        // Kiểm tra user đã có membership trong kho này chưa
        var existing = await _db.WarehouseMemberships
            .FirstOrDefaultAsync(m => m.UserId == dto.UserId && m.WarehouseId == dto.WarehouseId, ct);

        if (existing != null)
            throw new InvalidOperationException(
                $"Người dùng đã có membership trong kho này (membership id: {existing.Id}). " +
                "Vui lòng deactivate membership cũ trước hoặc dùng tài khoản khác.");

        // Lấy WarehouseRole theo Code
        var role = await _db.WarehouseRoles
            .FirstOrDefaultAsync(r => r.Code == dto.RoleCode, ct)
            ?? throw new InvalidOperationException($"Role '{dto.RoleCode}' không tồn tại trong hệ thống.");

        // Tạo membership
        var membership = new WarehouseMembership
        {
            UserId          = dto.UserId,
            WarehouseId     = dto.WarehouseId,
            WarehouseRoleId = role.Id,
            IsActive        = true,
            IsAllSkill      = dto.IsAllSkill,
            IsAllZone       = dto.IsAllZone,
            CreatedAt       = DateTime.UtcNow,
        };

        // Gán skills
        if (dto.SkillIds.Any())
        {
            var skills = await _db.Skills
                .Where(s => dto.SkillIds.Contains(s.Id))
                .ToListAsync(ct);
            foreach (var s in skills)
                membership.Skills.Add(s);
        }

        // Gán zones
        if (dto.ZoneIds.Any())
        {
            var zones = await _db.Zones
                .Where(z => dto.ZoneIds.Contains(z.Id))
                .ToListAsync(ct);
            foreach (var z in zones)
                membership.Zones.Add(z);
        }

        _db.WarehouseMemberships.Add(membership);
        await _db.SaveChangesAsync(ct);

        return membership.Id;
    }

    // ── GetManagedWarehousesAsync ──────────────────────────────────────────
    public async Task<List<ManagedWarehouseDto>> GetManagedWarehousesAsync(
        int userId,
        CancellationToken ct = default)
    {
        // Chỉ trả về những kho mà user có role OPERATOR hoặc MANAGER và membership đang active
        var allowedRoles = new[] { "OPERATOR", "MANAGER" };

        var result = await _db.WarehouseMemberships
            .Where(m => m.UserId == userId && m.IsActive && allowedRoles.Contains(m.Role.Code))
            .Include(m => m.Role)
            .Include(m => m.Warehouse)
            .Select(m => new ManagedWarehouseDto
            {
                WarehouseId   = m.WarehouseId,
                WarehouseName = m.Warehouse.Name,
                RoleCode      = m.Role.Code,
            })
            .ToListAsync(ct);

        return result;
    }

    // ── GetMembershipByIdAsync ─────────────────────────────────────────────────
    public async Task<MembershipInfoDto?> GetMembershipByIdAsync(
        int membershipId,
        CancellationToken ct = default)
    {
        var m = await _db.WarehouseMemberships
            .Where(x => x.Id == membershipId)
            .Include(x => x.Role)
            .FirstOrDefaultAsync(ct);

        if (m == null) return null;

        return new MembershipInfoDto
        {
            MembershipId = m.Id,
            WarehouseId  = m.WarehouseId,
            UserId       = m.UserId,
            RoleCode     = m.Role.Code,
        };
    }

    // ── ReassignMembershipAsync ────────────────────────────────────────
    public async Task ReassignMembershipAsync(
        ReassignMembershipDto dto,
        CancellationToken ct = default)
    {
        var membership = await _db.WarehouseMemberships
            .Where(m => m.Id == dto.MembershipId)
            .Include(m => m.Skills)
            .Include(m => m.Zones)
            .FirstOrDefaultAsync(ct)
            ?? throw new KeyNotFoundException($"Membership {dto.MembershipId} không tồn tại.");

        // Cập nhật role
        var role = await _db.WarehouseRoles
            .FirstOrDefaultAsync(r => r.Code == dto.TargetRoleCode, ct)
            ?? throw new InvalidOperationException($"Role '{dto.TargetRoleCode}' không tồn tại.");

        membership.WarehouseRoleId = role.Id;
        membership.IsAllSkill      = dto.IsAllSkill;
        membership.IsAllZone       = dto.IsAllZone;

        // Xóa skills cũ và gán lại
        membership.Skills.Clear();
        if (!dto.IsAllSkill && dto.SkillIds.Any())
        {
            var skills = await _db.Skills
                .Where(s => dto.SkillIds.Contains(s.Id))
                .ToListAsync(ct);
            foreach (var s in skills) membership.Skills.Add(s);
        }

        // Xóa zones cũ và gán lại
        membership.Zones.Clear();
        if (!dto.IsAllZone && dto.ZoneIds.Any())
        {
            var zones = await _db.Zones
                .Where(z => dto.ZoneIds.Contains(z.Id))
                .ToListAsync(ct);
            foreach (var z in zones) membership.Zones.Add(z);
        }

        await _db.SaveChangesAsync(ct);
    }
}
