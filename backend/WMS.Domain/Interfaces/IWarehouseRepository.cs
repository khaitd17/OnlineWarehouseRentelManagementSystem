using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface IWarehouseRepository
{
    Task<int> CreateAsync(Warehouse warehouse, CancellationToken cancellationToken);

    Task<int?> FindWarehouseOwnerById(int warehouseId, CancellationToken cancellationToken);
}