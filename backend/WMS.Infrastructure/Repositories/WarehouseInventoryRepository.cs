using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Repositories;

public class WarehouseInventoryRepository : IWarehouseInventoryRepository
{
    private readonly ApplicationDbContext _context;

    public WarehouseInventoryRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<WarehouseInventory?> GetAsync(int warehouseId, string itemName, CancellationToken cancellationToken)
        => await _context.WarehouseInventories
            .FirstOrDefaultAsync(i => i.WarehouseId == warehouseId && i.ItemName == itemName, cancellationToken);

    public async Task<List<WarehouseInventory>> GetByWarehouseAsync(int warehouseId, CancellationToken cancellationToken)
        => await _context.WarehouseInventories
            .Where(i => i.WarehouseId == warehouseId)
            .ToListAsync(cancellationToken);

    public async Task AdjustQuantityAsync(int warehouseId, string itemName, string unit, int delta, CancellationToken cancellationToken)
    {
        var inv = await _context.WarehouseInventories
            .FirstOrDefaultAsync(i => i.WarehouseId == warehouseId && i.ItemName == itemName, cancellationToken);

        if (inv == null)
        {
            // First time this item appears in this warehouse
            inv = new WarehouseInventory
            {
                WarehouseId = warehouseId,
                ItemName = itemName,
                Unit = unit,
                Quantity = 0,
                UpdatedAt = DateTime.Now
            };
            _context.WarehouseInventories.Add(inv);
        }

        var newQty = inv.Quantity + delta;
        if (newQty < 0)
            throw new InvalidOperationException(
                $"Insufficient inventory for '{itemName}'. Current: {inv.Quantity}, Requested: {Math.Abs(delta)}.");

        inv.Quantity = newQty;
        inv.UpdatedAt = DateTime.Now;
        await _context.SaveChangesAsync(cancellationToken);
    }
}
