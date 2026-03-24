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
    Task UpdateStatusesAsync(List<int> equipmentIds, string status, CancellationToken cancellationToken);
    Task<List<Equipment>> GetByOwnerIdAsync(int ownerId, CancellationToken cancellationToken);
    
    // New methods
    Task AddHistoryAsync(EquipmentHistory history, CancellationToken cancellationToken);
    Task AddMaintenanceRecordAsync(EquipmentMaintenanceRecord record, CancellationToken cancellationToken);
    Task<List<EquipmentHistory>> GetHistoryAsync(int equipmentId, CancellationToken cancellationToken);
    Task<List<EquipmentMaintenanceRecord>> GetMaintenanceRecordsAsync(int equipmentId, CancellationToken cancellationToken);
    Task<List<Equipment>> GetByRentalAreaIdAsync(int rentalAreaId, CancellationToken cancellationToken);
}
