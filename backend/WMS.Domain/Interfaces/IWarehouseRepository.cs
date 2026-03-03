using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface IWarehouseRepository
{
    Task<Warehouse?> GetByIdAsync(int id);
    Task<IEnumerable<Warehouse>> GetAllAsync();
    Task AddAsync(Warehouse warehouse);
    Task UpdateAsync(Warehouse warehouse);
    Task<bool> DeleteAsync(int id);
}