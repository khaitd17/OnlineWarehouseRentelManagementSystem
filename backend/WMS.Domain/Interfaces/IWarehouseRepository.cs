using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface IWarehouseRepository
{
    Task AddAsync(Warehouse warehouse);
}