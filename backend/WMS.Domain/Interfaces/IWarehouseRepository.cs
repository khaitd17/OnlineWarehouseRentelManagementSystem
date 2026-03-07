using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface IWarehouseRepository
{
    Task<Warehouse?> GetByIdAsync(int id);
    Task AddAsync(Warehouse warehouse);
    Task<int?> FindWarehouseOwnerById(int id, CancellationToken tk);
}