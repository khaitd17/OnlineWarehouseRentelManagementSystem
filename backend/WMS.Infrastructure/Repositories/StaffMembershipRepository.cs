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

        // Bước 2: base query — tất cả memberships trong kho (scope filter bên dưới xử lý visibility)
        var query = _db.WarehouseMemberships
            .Where(m => m.WarehouseId == warehouseId);

        // Bước 3: áp scope filter — chỉ thấy bản thân + cấp dưới, KHÔNG thấy cùng cấp hay cấp trên
        if (caller != null)
        {
            int callerUserId = callerId!.Value;

            if (caller.RoleCode == "OWNER")
            {
                // OWNER thấy tất cả cấp dưới: OPERATOR, MANAGER, STAFF
                // (không cần thấy RENTER vì RENTER không phải staff vận hành)
                query = query.Where(m =>
                    m.Role.Code == "OPERATOR" ||
                    m.Role.Code == "MANAGER"  ||
                    m.Role.Code == "STAFF"    ||
                    m.UserId == callerUserId   // bao gồm chính mình (OWNER membership)
                );
            }
            else if (caller.RoleCode == "OPERATOR")
            {
                // OPERATOR thấy MANAGER + STAFF + chính mình; KHÔNG thấy OWNER hay OPERATOR khác
                query = query.Where(m =>
                    m.Role.Code == "MANAGER" ||
                    m.Role.Code == "STAFF"   ||
                    m.UserId == callerUserId
                );
            }
            else if (caller.RoleCode == "MANAGER")
            {
                var callerSkillIds = caller.SkillIds;
                bool allSkill      = caller.IsAllSkill;

                // MANAGER thấy STAFF trong phạm vi skill + chính mình
                // KHÔNG thấy OPERATOR hay MANAGER khác
                query = query.Where(m =>
                    m.UserId == callerUserId ||
                    (m.Role.Code == "STAFF" && (
                        allSkill ||
                        m.IsAllSkill ||
                        m.Skills.Any(s => callerSkillIds.Contains(s.Id))
                    ))
                );
            }
            else
            {
                // STAFF, RENTER hay bất kỳ role khác → chỉ thấy chính mình
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

        // Bước 5: Load tất cả matching, group by UserId → giữ role cao nhất mỗi user
        // Fix: 1 user có nhiều memberships (vd OWNER + OPERATOR) sẽ chỉ hiển thị 1 lần
        var allMatching = await query
            .Include(m => m.User)
            .Include(m => m.Role)
            .Include(m => m.Skills)
            .ToListAsync(ct);

        var rolePriority = new[] { "OWNER", "OPERATOR", "MANAGER", "STAFF", "RENTER" };

        var grouped = allMatching
            .GroupBy(m => m.UserId)
            .Select(g => g.OrderBy(m =>
            {
                var idx = Array.IndexOf(rolePriority, m.Role?.Code ?? "");
                return idx < 0 ? 999 : idx;
            }).First())
            .OrderBy(m =>
            {
                var idx = Array.IndexOf(rolePriority, m.Role?.Code ?? "");
                return idx < 0 ? 999 : idx;
            })
            .ThenBy(m => m.User.FullName)
            .ToList();

        var total = grouped.Count;

        var items = grouped
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

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
    // Khi user có nhiều memberships trong cùng 1 kho (vd: OWNER + OPERATOR),
    // trả về role cao nhất theo thứ tự: OWNER > OPERATOR > MANAGER > STAFF > RENTER
    public async Task<CallerMembershipDto?> GetCallerMembershipAsync(
        int userId,
        int warehouseId,
        CancellationToken ct = default)
    {
        var rolePriority = new[] { "OWNER", "OPERATOR", "MANAGER", "STAFF", "RENTER" };

        var memberships = await _db.WarehouseMemberships
            .Where(x => x.UserId == userId && x.WarehouseId == warehouseId && x.IsActive)
            .Include(x => x.Role)
            .Include(x => x.Skills)
            .ToListAsync(ct);

        if (!memberships.Any()) return null;

        // Chọn membership có role ưu tiên cao nhất
        var best = memberships
            .OrderBy(m => {
                var idx = Array.IndexOf(rolePriority, m.Role.Code);
                return idx < 0 ? 999 : idx;
            })
            .First();

        return new CallerMembershipDto
        {
            MembershipId = best.Id,
            RoleCode     = best.Role.Code,
            IsAllSkill   = best.IsAllSkill,
            SkillIds     = best.Skills.Select(s => s.Id).ToList(),
            SkillCodes   = best.Skills.Select(s => s.Code).ToList(),
            AllRoleCodes = memberships.Select(m => m.Role.Code).Distinct().ToList(),
        };
    }

    // ── HasRoleAsync ──────────────────────────────────────────────────────────
    // Kiểm tra user CÓ membership với role cụ thể trong kho không.
    // Không dùng priority — 1 user có thể có cả OWNER lẫn OPERATOR membership.
    // Dùng cho: phân quyền thương mại (HasRole OWNER) vs vận hành (HasRole OPERATOR).
    public async Task<bool> HasRoleAsync(
        int userId,
        int warehouseId,
        string roleCode,
        CancellationToken ct = default)
    {
        return await _db.WarehouseMemberships
            .AnyAsync(m =>
                m.UserId      == userId      &&
                m.WarehouseId == warehouseId &&
                m.IsActive                   &&
                m.Role.Code   == roleCode,
                ct);
    }

    // ── GetMembershipByRoleAsync ──────────────────────────────────────────────
    // Lấy CallerMembershipDto của user theo role cụ thể.
    // Dùng khi cần lấy skill của OPERATOR (hoặc role cụ thể khác) để check quyền chi tiết.
    public async Task<CallerMembershipDto?> GetMembershipByRoleAsync(
        int userId,
        int warehouseId,
        string roleCode,
        CancellationToken ct = default)
    {
        var m = await _db.WarehouseMemberships
            .Where(x =>
                x.UserId      == userId      &&
                x.WarehouseId == warehouseId &&
                x.IsActive                   &&
                x.Role.Code   == roleCode)
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
        // Lấy role trước để biết roleId
        var role = await _db.WarehouseRoles
            .FirstOrDefaultAsync(r => r.Code == dto.RoleCode, ct)
            ?? throw new InvalidOperationException($"Role '{dto.RoleCode}' không tồn tại trong hệ thống.");

        // Kiểm tra user đã có cùng role trong cùng kho này chưa
        // (cho phép cùng user có nhiều role khác nhau trong cùng 1 kho)
        var existing = await _db.WarehouseMemberships
            .FirstOrDefaultAsync(m => m.UserId == dto.UserId
                                   && m.WarehouseId == dto.WarehouseId
                                   && m.WarehouseRoleId == role.Id, ct);

        if (existing != null)
            throw new InvalidOperationException(
                $"Người dùng đã có membership role '{dto.RoleCode}' trong kho này (membership id: {existing.Id})." );

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
        var allowedRoles = new[] { "OWNER", "OPERATOR", "MANAGER" };

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
        var rows = await _db.WarehouseMemberships
            .Where(m => m.UserId == userId && m.IsActive)
            .Include(m => m.Role)
            .Include(m => m.Warehouse)
            .ToListAsync(ct);

        return rows
            .DistinctBy(m => m.WarehouseId)
            .Select(m => new MyWarehouseItemDto
            {
                WarehouseId   = m.WarehouseId,
                WarehouseName = m.Warehouse.Name,
                RoleCode      = m.Role?.Code ?? "",
                HasZone       = m.Warehouse.HasZone,
            })
            .ToList();
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
