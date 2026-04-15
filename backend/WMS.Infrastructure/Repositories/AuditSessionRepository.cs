using Microsoft.EntityFrameworkCore;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Repositories;

public class AuditSessionRepository : IAuditSessionRepository
{
    private readonly ApplicationDbContext _db;

    public AuditSessionRepository(ApplicationDbContext db) => _db = db;

    public async Task<AuditSessionBasicDto?> GetSessionBasicAsync(int auditId, CancellationToken ct = default)
    {
        return await _db.AuditSessions
            .Where(a => a.AuditId == auditId)
            .Select(a => new AuditSessionBasicDto
            {
                AuditId     = a.AuditId,
                WarehouseId = a.WarehouseId,
                CreatedBy   = a.CreatedBy,
                Status      = a.Status,
            })
            .FirstOrDefaultAsync(ct);
    }

    public async Task<List<AuditStaffDto>> GetInventoryStaffAsync(int warehouseId, CancellationToken ct = default)
    {
        return await _db.WarehouseMemberships
            .Where(m => m.WarehouseId == warehouseId
                     && m.IsActive
                     && m.Role.Code == "STAFF"
                     && (m.IsAllSkill || m.Skills.Any(s => s.Code == "INVENTORY_OPERATOR")))
            .Select(m => new AuditStaffDto
            {
                UserId   = m.UserId,
                FullName = m.User.FullName,
                Email    = m.User.Email,
                Phone    = m.User.Phone,
            })
            .ToListAsync(ct);
    }

    public async Task<List<AuditInventoryItemDto>> GetWarehouseInventoryAsync(int warehouseId, CancellationToken ct = default)
    {
        return await _db.WarehouseInventories
            .Where(wi => wi.WarehouseId == warehouseId && wi.Quantity > 0)
            .Select(wi => new AuditInventoryItemDto
            {
                ItemName = wi.ItemName,
                Quantity = (int)wi.Quantity,
                Unit     = wi.Unit,
            })
            .OrderBy(i => i.ItemName)
            .ToListAsync(ct);
    }

    public async Task<List<AuditInventoryItemDto>> GetInventoryToAuditAsync(
        int auditId, int warehouseId, int createdBy, string creatorRole,
        CancellationToken ct = default)
    {
        var result = new List<AuditInventoryItemDto>();

        if (creatorRole == "RENTER")
        {
            // RENTER chỉ thấy hàng của mình
            var items = await _db.RenterInventories
                .Include(ri => ri.Asset)
                .Where(ri => ri.WarehouseId == warehouseId
                          && ri.Asset.RenterId == createdBy
                          && ri.Quantity > 0)
                .Select(ri => new AuditInventoryItemDto
                {
                    ItemName = ri.Asset.AssetName,
                    Quantity = ri.Quantity,
                    Unit     = ri.Asset.Unit,
                })
                .OrderBy(i => i.ItemName)
                .ToListAsync(ct);
            result.AddRange(items);
        }
        else
        {
            // OWNER (hoặc role khác) thấy toàn bộ warehouse inventory + tất cả renter inventory
            var warehouseItems = await _db.WarehouseInventories
                .Where(wi => wi.WarehouseId == warehouseId && wi.Quantity > 0)
                .Select(wi => new AuditInventoryItemDto
                {
                    ItemName = wi.ItemName,
                    Quantity = (int)wi.Quantity,
                    Unit     = wi.Unit,
                })
                .ToListAsync(ct);

            var renterItems = await _db.RenterInventories
                .Include(ri => ri.Asset)
                .Where(ri => ri.WarehouseId == warehouseId && ri.Quantity > 0)
                .Select(ri => new AuditInventoryItemDto
                {
                    ItemName = ri.Asset.AssetName,
                    Quantity = ri.Quantity,
                    Unit     = ri.Asset.Unit,
                })
                .ToListAsync(ct);

            result.AddRange(warehouseItems);
            result.AddRange(renterItems);
            result = result.OrderBy(i => i.ItemName).ToList();
        }

        return result;
    }
}
