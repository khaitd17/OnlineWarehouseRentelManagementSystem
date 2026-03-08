using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface IWarehouseRepository
{
    Task AddAsync(Warehouse warehouse);
    Task<int?> FindWarehouseOwnerById(int id, CancellationToken tk);
    Task<List<WarehouseListDto>> GetWarehousesByOwnerIdAsync(int ownerId, CancellationToken tk = default);
}

public record WarehouseListDto(
    int WarehouseId,
    string Name,
    string Status
);