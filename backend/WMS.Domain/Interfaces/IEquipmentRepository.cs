using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface IEquipmentRepository
{
    Task<Equipment?> GetByIdAsync(int equipmentId, CancellationToken cancellationToken);
    Task<List<Equipment>> GetByWarehouseIdAsync(int warehouseId, CancellationToken cancellationToken);
    Task<int> CreateAsync(Equipment equipment, CancellationToken cancellationToken);
    Task UpdateAsync(Equipment equipment, CancellationToken cancellationToken);
    Task DeleteAsync(int equipmentId, CancellationToken cancellationToken);
    Task UpdateStatusAsync(int equipmentId, string status, CancellationToken cancellationToken);
}
