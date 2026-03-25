using Microsoft.EntityFrameworkCore;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Repositories;

public class RenterAssetRepository : IRenterAssetRepository
{
    private readonly ApplicationDbContext _context;

    public RenterAssetRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<RenterInventoryRowDto>> GetInventoryByRenterAsync(
        int renterId,
        int? warehouseId,
        CancellationToken cancellationToken)
    {
        var query =
            from inv in _context.RenterInventories
            join asset in _context.RenterAssets on inv.AssetId equals asset.AssetId
            join wh in _context.Warehouses on inv.WarehouseId equals wh.WarehouseId
            where asset.RenterId == renterId
            select new RenterInventoryRowDto
            {
                InventoryId   = inv.InventoryId,
                AssetId       = asset.AssetId,
                AssetName     = asset.AssetName,
                Unit          = asset.Unit,
                WeightPerUnit = asset.WeightPerUnit,
                Description   = asset.Description,
                WarehouseId   = inv.WarehouseId,
                WarehouseName = wh.Name,
                Quantity      = inv.Quantity,
                UpdatedAt     = inv.UpdatedAt,
            };

        if (warehouseId.HasValue)
            query = query.Where(r => r.WarehouseId == warehouseId.Value);

        return await query
            .OrderBy(r => r.WarehouseName)
            .ThenBy(r => r.AssetName)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<WarehouseInventoryRowDto>> GetInventoryByWarehouseAsync(
        int warehouseId,
        CancellationToken cancellationToken)
    {
        var query =
            from inv in _context.RenterInventories
            join asset in _context.RenterAssets on inv.AssetId equals asset.AssetId
            join renter in _context.Users on asset.RenterId equals renter.UserId
            where inv.WarehouseId == warehouseId
            select new WarehouseInventoryRowDto
            {
                InventoryId   = inv.InventoryId,
                AssetId       = asset.AssetId,
                AssetName     = asset.AssetName,
                Unit          = asset.Unit,
                WeightPerUnit = asset.WeightPerUnit,
                Description   = asset.Description,
                RenterId      = asset.RenterId,
                RenterName    = renter.FullName,
                RenterEmail   = renter.Email,
                Quantity      = inv.Quantity,
                UpdatedAt     = inv.UpdatedAt,
            };

        return await query
            .OrderBy(r => r.RenterName)
            .ThenBy(r => r.AssetName)
            .ToListAsync(cancellationToken);
    }
}
