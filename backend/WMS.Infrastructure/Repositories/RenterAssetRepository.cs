using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Repositories;

public class RenterAssetRepository : IRenterAssetRepository
{
    private readonly ApplicationDbContext _db;

    public RenterAssetRepository(ApplicationDbContext db) => _db = db;

    public async Task<List<RenterAsset>> GetByRenterAsync(int renterId, CancellationToken ct)
        => await _db.RenterAssets
            .Where(a => a.RenterId == renterId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(ct);

    public async Task<RenterAsset?> GetByIdAsync(int assetId, CancellationToken ct)
        => await _db.RenterAssets.FindAsync(new object[] { assetId }, ct);

    public async Task<RenterAsset?> FindByNameAndRenterAsync(int renterId, string assetName, CancellationToken ct)
        => await _db.RenterAssets
            .Where(a => a.RenterId == renterId &&
                        a.AssetName.ToLower() == assetName.ToLower())
            .FirstOrDefaultAsync(ct);

    public async Task<RenterAsset> CreateAsync(RenterAsset asset, CancellationToken ct)
    {
        asset.CreatedAt = DateTime.Now;
        _db.RenterAssets.Add(asset);
        await _db.SaveChangesAsync(ct);
        return asset;
    }

    /// <summary>API cũ: lấy tồn kho của 1 renter tại 1 warehouse</summary>
    public async Task<List<RenterInventory>> GetInventoryByWarehouseAsync(
        int renterId, int warehouseId, CancellationToken ct)
        => await _db.RenterInventories
            .Include(ri => ri.Asset)
            .Where(ri => ri.WarehouseId == warehouseId && ri.Asset.RenterId == renterId)
            .ToListAsync(ct);

    public async Task AdjustRenterInventoryAsync(
        int assetId, int warehouseId, int delta, CancellationToken ct)
    {
        var inv = await _db.RenterInventories
            .FirstOrDefaultAsync(ri => ri.AssetId == assetId && ri.WarehouseId == warehouseId, ct);

        if (inv == null)
        {
            inv = new RenterInventory
            {
                AssetId     = assetId,
                WarehouseId = warehouseId,
                Quantity    = 0,
                UpdatedAt   = DateTime.Now
            };
            _db.RenterInventories.Add(inv);
        }

        var newQty = inv.Quantity + delta;
        if (newQty < 0)
            throw new InvalidOperationException(
                $"Không đủ tồn kho. Hiện có: {inv.Quantity}, yêu cầu xuất: {Math.Abs(delta)}.");

        inv.Quantity  = newQty;
        inv.UpdatedAt = DateTime.Now;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<List<RenterInventoryRowDto>> GetInventoryByRenterAsync(
        int renterId,
        int? warehouseId,
        CancellationToken cancellationToken)
    {
        var query = _db.RenterInventories
            .Include(ri => ri.Asset)
            .Include(ri => ri.Warehouse)
            .Where(ri => ri.Asset.RenterId == renterId);

        if (warehouseId.HasValue)
            query = query.Where(ri => ri.WarehouseId == warehouseId.Value);

        return await query
            .Select(ri => new RenterInventoryRowDto
            {
                InventoryId   = ri.InventoryId,
                AssetId       = ri.AssetId,
                AssetName     = ri.Asset.AssetName,
                Unit          = ri.Asset.Unit,
                WeightPerUnit = ri.Asset.WeightPerUnit,
                Description   = ri.Asset.Description,
                WarehouseId   = ri.WarehouseId,
                WarehouseName = ri.Warehouse.Name,
                Quantity      = ri.Quantity,
                UpdatedAt     = ri.UpdatedAt
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<List<WarehouseInventoryRowDto>> GetInventoryByWarehouseAsync(
        int warehouseId,
        CancellationToken cancellationToken)
    {
        return await _db.RenterInventories
            .Include(ri => ri.Asset)
                .ThenInclude(a => a.Renter)
            .Where(ri => ri.WarehouseId == warehouseId)
            .Select(ri => new WarehouseInventoryRowDto
            {
                InventoryId   = ri.InventoryId,
                AssetId       = ri.AssetId,
                AssetName     = ri.Asset.AssetName,
                Unit          = ri.Asset.Unit,
                WeightPerUnit = ri.Asset.WeightPerUnit,
                Description   = ri.Asset.Description,
                RenterId      = ri.Asset.RenterId,
                RenterName    = ri.Asset.Renter.FullName,
                RenterEmail   = ri.Asset.Renter.Email,
                Quantity      = ri.Quantity,
                UpdatedAt     = ri.UpdatedAt
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<string> GetHighestWarehouseRoleAsync(
        int userId, int warehouseId, CancellationToken ct)
    {
        var memberships = await _db.WarehouseMemberships
            .Include(m => m.Role)
            .Where(m => m.UserId == userId && m.WarehouseId == warehouseId && m.IsActive)
            .ToListAsync(ct);

        foreach (var r in new[] { "OWNER", "OPERATOR", "MANAGER", "STAFF", "RENTER" })
        {
            if (memberships.Any(m => m.Role?.Code?.ToUpper() == r))
                return r;
        }
        return "";
    }

    public async Task ClearRenterInventoryAsync(int renterId, int warehouseId, CancellationToken ct)
    {
        // Lấy tất cả asset_id thuộc renter này
        var assetIds = await _db.RenterAssets
            .Where(a => a.RenterId == renterId)
            .Select(a => a.AssetId)
            .ToListAsync(ct);

        if (!assetIds.Any()) return;

        // Xóa toàn bộ tồn kho tại kho đó
        var rows = await _db.RenterInventories
            .Where(ri => assetIds.Contains(ri.AssetId) && ri.WarehouseId == warehouseId)
            .ToListAsync(ct);

        if (rows.Any())
        {
            _db.RenterInventories.RemoveRange(rows);
            await _db.SaveChangesAsync(ct);
        }
    }
}
