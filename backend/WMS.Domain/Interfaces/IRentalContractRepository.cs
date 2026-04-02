using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface IRentalContractRepository
{
    Task<RentalContract?> GetByIdAsync(int contractId);
    Task<RentalContract?> GetByRentalRequestIdAsync(int requestId);
    Task<IEnumerable<RentalContract>> GetByRenterIdAsync(int renterId);
    Task<IEnumerable<RentalContract>> GetByWarehouseIdAsync(int warehouseId);
    Task<IEnumerable<RentalContract>> GetActiveContractsAsync();
    Task<List<RentalContract>> GetPagedAsync(
        int pageNumber,
        int pageSize,
        int? userId = null,
        string? status = null,
        DateTime? startDateFrom = null,
        DateTime? startDateTo = null);
    Task<int> CountAsync(
        int? userId = null,
        string? status = null,
        DateTime? startDateFrom = null,
        DateTime? startDateTo = null);
    Task<int> AddAsync(RentalContract contract);
    Task UpdateAsync(RentalContract contract);
    Task<RentalContract?> GetWithEquipmentsByIdAsync(int contractId);
    Task AssignEquipmentsAsync(int contractId, List<int> equipmentIds, CancellationToken cancellationToken);
    
    // Direct DB operations for termination (bypass domain model reflection issues)
    Task RequestTerminationAsync(int contractId, string requestedBy, string? reason = null, decimal? fee = null);
    Task RequestCloseAsync(int contractId, string requestedBy);
    Task ApproveTerminationAsync(int contractId, string approvedBy);
    Task RejectTerminationAsync(int contractId);
}
