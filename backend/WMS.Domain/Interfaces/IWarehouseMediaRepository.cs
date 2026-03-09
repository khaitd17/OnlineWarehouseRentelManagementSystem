using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface IWarehouseMediaRepository
{
    Task AddAsync(
        int warehouseId,
        string mediaUrl,
        string mediaType,
        bool isPrimary,
        CancellationToken cancellationToken);

    Task<List<string>> GetByWarehouseIdAsync(
        int warehouseId,
        CancellationToken cancellationToken);
}