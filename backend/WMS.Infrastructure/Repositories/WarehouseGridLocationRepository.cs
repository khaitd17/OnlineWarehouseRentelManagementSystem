using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Domain.Models;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Repositories;

public class WarehouseGridLocationRepository : IWarehouseGridLocationRepository
{
    private readonly ApplicationDbContext _db;

    public WarehouseGridLocationRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<GridInventoryStatusModel>> GetGridInventoryStatusAsync(int warehouseId, CancellationToken ct)
    {
        var inventories = await _db.RenterInventories
            .Include(i => i.Asset).ThenInclude(a => a.Renter)
            .Where(i => i.WarehouseId == warehouseId)
            .ToListAsync(ct);

        var gridLocations = await _db.WarehouseGridLocations
            .Include(g => g.Asset).ThenInclude(a => a.Renter)
            .Include(g => g.Renter)
            .Where(g => g.WarehouseId == warehouseId && g.Quantity > 0)
            .ToListAsync(ct);

        var statusList = new List<GridInventoryStatusModel>();

        var groupedGrids = gridLocations
            .GroupBy(g => new { g.AssetId, g.ItemName })
            .ToList();

        foreach (var inv in inventories)
        {
            var assignedQty = groupedGrids
                .Where(g => g.Key.AssetId == inv.AssetId || (inv.AssetId == 0 && g.Key.ItemName == inv.Asset.AssetName))
                .SelectMany(g => g)
                .Sum(g => g.Quantity);

            statusList.Add(new GridInventoryStatusModel
            {
                AssetId = inv.AssetId,
                ItemName = inv.Asset?.AssetName ?? "Unknown",
                RenterId = inv.Asset?.RenterId,
                RenterName = inv.Asset?.Renter?.FullName,
                Unit = inv.Asset?.Unit ?? "cái",
                InventoryQuantity = inv.Quantity,
                AssignedQuantity = assignedQty
            });
        }

        foreach (var group in groupedGrids)
        {
            bool existsInInv = inventories.Any(i => i.AssetId == group.Key.AssetId || (group.Key.AssetId == null && i.Asset.AssetName == group.Key.ItemName));
            if (!existsInInv)
            {
                var firstLoc = group.First();
                statusList.Add(new GridInventoryStatusModel
                {
                    AssetId = firstLoc.AssetId,
                    ItemName = firstLoc.ItemName ?? firstLoc.Asset?.AssetName ?? "Unknown",
                    RenterId = firstLoc.RenterId ?? firstLoc.Asset?.RenterId,
                    RenterName = firstLoc.Renter?.FullName ?? firstLoc.Asset?.Renter?.FullName,
                    Unit = firstLoc.Asset?.Unit ?? "cái",
                    InventoryQuantity = 0,
                    AssignedQuantity = group.Sum(g => g.Quantity)
                });
            }
        }

        return statusList;
    }

    public async Task<List<WarehouseGridLocation>> GetByWarehouseAsync(int warehouseId, int? renterId, CancellationToken ct)
    {
        var query = _db.WarehouseGridLocations
            .Include(g => g.Asset)
            .Include(g => g.Renter)
            .Where(g => g.WarehouseId == warehouseId && g.Quantity > 0);

        if (renterId.HasValue)
        {
            query = query.Where(g => g.RenterId == renterId.Value || (g.Asset != null && g.Asset.RenterId == renterId.Value));
        }

        return await query.ToListAsync(ct);
    }

    public async Task<List<WarehouseGridLocation>> GetByRequestItemsAsync(int warehouseId, List<int> assetIds, List<string> itemNames, CancellationToken ct)
    {
        return await _db.WarehouseGridLocations
            .Where(g => g.WarehouseId == warehouseId && g.Quantity > 0 &&
                        (
                            (g.AssetId.HasValue && assetIds.Contains(g.AssetId.Value)) ||
                            (!string.IsNullOrEmpty(g.ItemName) && itemNames.Contains(g.ItemName))
                        ))
            .ToListAsync(ct);
    }

    public async Task AssignGridLocationsAsync(int warehouseId, List<WarehouseGridLocation> assignments, CancellationToken ct)
    {
        foreach (var req in assignments)
        {
            req.WarehouseId = warehouseId;
            req.UpdatedAt = DateTime.Now;
            _db.WarehouseGridLocations.Add(req);
        }
        await _db.SaveChangesAsync(ct);
    }

    public async Task RemoveGridLocationByIdAsync(int warehouseId, int id, int quantityToRemove, CancellationToken ct)
    {
        var existing = await _db.WarehouseGridLocations.FirstOrDefaultAsync(
            g => g.WarehouseId == warehouseId && g.Id == id, ct);

        if (existing != null)
        {
            existing.Quantity -= quantityToRemove;
            if (existing.Quantity <= 0)
            {
                _db.WarehouseGridLocations.Remove(existing);
            }
            else
            {
                existing.UpdatedAt = DateTime.Now;
            }
            await _db.SaveChangesAsync(ct);
        }
    }
}
