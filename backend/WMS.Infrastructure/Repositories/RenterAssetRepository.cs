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

    public async Task<RenterAsset> CreateAsync(RenterAsset asset, CancellationToken ct)
    {
        asset.CreatedAt = DateTime.Now;
        _db.RenterAssets.Add(asset);
        await _db.SaveChangesAsync(ct);
        return asset;
    }

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
                AssetId = assetId,
                WarehouseId = warehouseId,
                Quantity = 0,
                UpdatedAt = DateTime.Now
            };
            _db.RenterInventories.Add(inv);
        }

        var newQty = inv.Quantity + delta;
        if (newQty < 0)
            throw new InvalidOperationException(
                $"Không đủ tồn kho. Hiện có: {inv.Quantity}, yêu cầu xuất: {Math.Abs(delta)}.");

        inv.Quantity = newQty;
        inv.UpdatedAt = DateTime.Now;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<RenterAsset?> GetByIdAsync(int assetId, CancellationToken cancellationToken)
    {
        return await _context.RenterAssets
            .FirstOrDefaultAsync(a => a.AssetId == assetId, cancellationToken);
    }

    public async Task AdjustRenterInventoryAsync(
        int assetId, 
        int warehouseId, 
        int delta, 
        CancellationToken cancellationToken)
    {
        var inv = await _context.RenterInventories
            .FirstOrDefaultAsync(ri => ri.AssetId == assetId && ri.WarehouseId == warehouseId, cancellationToken);

        if (inv == null)
        {
            if (delta > 0)
            {
                inv = new WMS.Domain.Entities.RenterInventory
                {
                    AssetId = assetId,
                    WarehouseId = warehouseId,
                    Quantity = delta,
                    UpdatedAt = DateTime.Now
                };
                _context.RenterInventories.Add(inv);
            }
        }
        else
        {
            inv.Quantity += delta;
            if (inv.Quantity < 0) inv.Quantity = 0;
            inv.UpdatedAt = DateTime.Now;
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}

