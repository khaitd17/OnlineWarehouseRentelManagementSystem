using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface IWarehouseRepository
{
    Task<int> CreateAsync(Warehouse warehouse, CancellationToken cancellationToken);

    Task<int?> FindWarehouseOwnerById(int warehouseId, CancellationToken cancellationToken);

    Task<Warehouse?> GetByIdAsync(int warehouseId, CancellationToken cancellationToken);
    Task<List<Warehouse>> GetByOwnerIdAsync(int ownerId, CancellationToken cancellationToken);
    Task UpdateAsync(Warehouse warehouse, CancellationToken cancellationToken);

    Task<bool> ExistsAsync(int warehouseId, CancellationToken cancellationToken);
}