using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface IRentalContractRepository
{
    Task<RentalContract?> GetByIdAsync(int contractId);
    Task<RentalContract?> GetByRentalRequestIdAsync(int requestId);
    Task<IEnumerable<RentalContract>> GetByRenterIdAsync(int renterId);
    Task<IEnumerable<RentalContract>> GetByWarehouseIdAsync(int warehouseId);
    Task<IEnumerable<RentalContract>> GetActiveContractsAsync();
    Task<int> AddAsync(RentalContract contract);
    Task UpdateAsync(RentalContract contract);
    Task<RentalContract?> GetWithEquipmentsByIdAsync(int contractId);
    Task AssignEquipmentsAsync(int contractId, List<int> equipmentIds, CancellationToken cancellationToken);
}
