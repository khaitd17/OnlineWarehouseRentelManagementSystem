using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface IWarehouseInventoryRepository
{
    Task<WarehouseInventory?> GetAsync(int warehouseId, string itemName, CancellationToken cancellationToken);
    Task<List<WarehouseInventory>> GetByWarehouseAsync(int warehouseId, CancellationToken cancellationToken);
    Task AdjustQuantityAsync(int warehouseId, string itemName, string unit, int delta, CancellationToken cancellationToken);
}
