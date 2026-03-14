using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Repositories;

public class InventoryTransactionRepository : IInventoryTransactionRepository
{
    private readonly ApplicationDbContext _context;

    public InventoryTransactionRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<InventoryTransaction> CreateAsync(InventoryTransaction transaction, CancellationToken cancellationToken)
    {
        transaction.CreatedAt = DateTime.Now;
        _context.InventoryTransactions.Add(transaction);
        await _context.SaveChangesAsync(cancellationToken);
        return transaction;
    }

    public async Task<(List<InventoryTransaction> Items, int TotalCount)> GetAllAsync(
        int? warehouseId, string? type, string? itemName,
        DateTime? from, DateTime? to,
        int page, int pageSize, CancellationToken cancellationToken)
    {
        var query = _context.InventoryTransactions
            .Include(t => t.Warehouse)
            .Include(t => t.PerformedByNavigation)
            .AsQueryable();

        if (warehouseId.HasValue)
            query = query.Where(t => t.WarehouseId == warehouseId.Value);
        if (!string.IsNullOrEmpty(type))
            query = query.Where(t => t.Type == type.ToUpper());
        if (!string.IsNullOrEmpty(itemName))
            query = query.Where(t => t.ItemName.Contains(itemName));
        if (from.HasValue)
            query = query.Where(t => t.CreatedAt >= from.Value);
        if (to.HasValue)
            query = query.Where(t => t.CreatedAt <= to.Value);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }
}
