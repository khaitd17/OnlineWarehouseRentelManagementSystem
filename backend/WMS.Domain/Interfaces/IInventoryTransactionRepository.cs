using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface IInventoryTransactionRepository
{
    Task<InventoryTransaction> CreateAsync(InventoryTransaction transaction, CancellationToken cancellationToken);

    Task<(List<InventoryTransaction> Items, int TotalCount)> GetAllAsync(
        int? warehouseId,
        string? type,
        string? itemName,
        DateTime? from,
        DateTime? to,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
}
