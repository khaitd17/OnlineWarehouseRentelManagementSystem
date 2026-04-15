using Microsoft.EntityFrameworkCore;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Repositories;

public class StaffMembershipRepository : IStaffMembershipRepository
{
    private readonly ApplicationDbContext _db;

    public StaffMembershipRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    // ── GetByWarehouseAsync (with optional scope filter) ──────────────────────
    public async Task<StaffMembershipPagedResult> GetByWarehouseAsync(
        int warehouseId,
        string? search,
        int page,
        int pageSize,
        int? callerId = null,
        CancellationToken ct = default)
    {
        // Bước 1: nếu có callerId, lấy thông tin caller để biết scope
        CallerMembershipDto? caller = null;
        if (callerId.HasValue)
            caller = await GetCallerMembershipAsync(callerId.Value, warehouseId, ct);

        // Bước 2: base query — tất cả non-OWNER memberships trong kho
        var query = _db.WarehouseMemberships
            .Where(m => m.WarehouseId == warehouseId && m.Role.Code != "OWNER");

        // Bước 3: áp scope filter
        if (caller != null)
        {
            if (caller.RoleCode == "MANAGER")
            {
                var callerSkillIds = caller.SkillIds;
                bool allSkill      = caller.IsAllSkill;

                // MANAGER chỉ thấy STAFF nằm trong phạm vi skill quản lý của mình
                query = query.Where(m =>
                    m.Role.Code == "STAFF" && (
                        allSkill ||
                        m.IsAllSkill ||
                        m.Skills.Any(s => callerSkillIds.Contains(s.Id))
                    )
                );
            }
            else if (caller.RoleCode == "OPERATOR")
            {
                // OPERATOR thấy MANAGER + STAFF (không thấy OWNER)
                query = query.Where(m =>
                    m.Role.Code == "MANAGER" || m.Role.Code == "STAFF"
                );
            }
            else
            {
                // STAFF (hoặc role khác) chỉ thấy chính mình
                int callerUserId = callerId!.Value;
                query = query.Where(m => m.UserId == callerUserId);
            }
        }

        // Bước 4: search filter
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(m =>
                m.User.FullName.ToLower().Contains(s) ||
                m.User.Email.ToLower().Contains(s));
        }

        // Bước 5: count + paginate
        var total = await query
            .Include(m => m.User)
            .Include(m => m.Role)
            .CountAsync(ct);

        var items = await query
            .Include(m => m.User)
            .Include(m => m.Role)
            .Include(m => m.Skills)
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
            Skills = m.Skills.Select(s => new SkillDto { Id = s.Id, Code = s.Code, Name = s.Name }).ToList(),
        }).ToList();

        return new StaffMembershipPagedResult
        {
            WarehouseId = warehouseId,
            Page        = page,
            PageSize    = pageSize,
            Total       = total,
            TotalPages  = (int)Math.Ceiling((double)total / pageSize),
            Items       = dtos,
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
            .FirstOrDefaultAsync(ct);

        if (m == null) return null;

        return new CallerMembershipDto
        {
            MembershipId = m.Id,
            RoleCode     = m.Role.Code,
            IsAllSkill   = m.IsAllSkill,
            SkillIds     = m.Skills.Select(s => s.Id).ToList(),
            SkillCodes   = m.Skills.Select(s => s.Code).ToList(),
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
            UserId            = dto.UserId,
            WarehouseId       = dto.WarehouseId,
            WarehouseRoleId   = role.Id,
            IsActive          = true,
            IsAllSkill        = dto.IsAllSkill,
            IsAllZone         = false,
            CreatedAt         = DateTime.UtcNow,
            WarehouseShiftId  = dto.WarehouseShiftId,
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

        _db.WarehouseMemberships.Add(membership);
        await _db.SaveChangesAsync(ct);

        return membership.Id;
    }

    // ── GetManagedWarehousesAsync ──────────────────────────────────────────
    public async Task<List<ManagedWarehouseDto>> GetManagedWarehousesAsync(
        int userId,
        CancellationToken ct = default)
    {
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
            .FirstOrDefaultAsync(ct)
            ?? throw new KeyNotFoundException($"Membership {dto.MembershipId} không tồn tại.");

        // Cập nhật role
        var role = await _db.WarehouseRoles
            .FirstOrDefaultAsync(r => r.Code == dto.TargetRoleCode, ct)
            ?? throw new InvalidOperationException($"Role '{dto.TargetRoleCode}' không tồn tại.");

        membership.WarehouseRoleId = role.Id;
        membership.IsAllSkill      = dto.IsAllSkill;

        // Xóa skills cũ và gán lại
        membership.Skills.Clear();
        if (!dto.IsAllSkill && dto.SkillIds.Any())
        {
            var skills = await _db.Skills
                .Where(s => dto.SkillIds.Contains(s.Id))
                .ToListAsync(ct);
            foreach (var s in skills) membership.Skills.Add(s);
        }

        await _db.SaveChangesAsync(ct);
    }

    // ── GetActiveManagersInWarehouseAsync ──────────────────────────────────────
    public async Task<List<ManagerScopeDto>> GetActiveManagersInWarehouseAsync(
        int warehouseId,
        CancellationToken ct = default)
    {
        return await _db.WarehouseMemberships
            .Where(m => m.WarehouseId == warehouseId && m.IsActive && m.Role.Code == "MANAGER")
            .Include(m => m.User)
            .Include(m => m.Role)
            .Include(m => m.Skills)
            .Select(m => new ManagerScopeDto
            {
                MembershipId = m.Id,
                FullName     = m.User!.FullName ?? m.User.Email ?? "",
                IsAllSkill   = m.IsAllSkill,
                SkillIds     = m.Skills.Select(s => s.Id).ToList(),
            })
            .ToListAsync(ct);
    }

    // ── GetMyWarehousesAsync ───────────────────────────────────────────────────
    public async Task<List<MyWarehouseItemDto>> GetMyWarehousesAsync(
        int userId,
        CancellationToken ct = default)
    {
        return await _db.WarehouseMemberships
            .Where(m => m.UserId == userId && m.IsActive)
            .Include(m => m.Role)
            .Include(m => m.Warehouse)
            .Select(m => new MyWarehouseItemDto
            {
                WarehouseId   = m.WarehouseId,
                WarehouseName = m.Warehouse.Name,
                RoleCode      = m.Role.Code,
                HasZone       = m.Warehouse.HasZone,
            })
            .ToListAsync(ct);
    }

    // ── GetSkillsAsync ────────────────────────────────────────────────────────
    public async Task<List<SkillDto>> GetSkillsAsync(CancellationToken ct = default)
    {
        return await _db.Skills
            .OrderBy(s => s.Name)
            .Select(s => new SkillDto { Id = s.Id, Code = s.Code, Name = s.Name })
            .ToListAsync(ct);
    }
}
