using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface IRentalContractRepository
{
    Task<RentalContract?> GetByIdAsync(int contractId);
    Task<RentalContract?> GetByIdWithDetailsAsync(int contractId);
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
    Task ApproveTerminationAsync(int contractId, string approvedBy, decimal? earlyTerminationFee = null);
    Task RejectTerminationAsync(int contractId);
    Task FinalizeTerminationAfterPaymentAsync(int contractId);
    Task ApplyExtensionAsync(int contractId, int durationMonths, decimal approvedMonthlyPayment);

    Task<bool> IsRenterByContractAsync(int renterId, int warehouseId, CancellationToken ct = default);

    /// <summary>
    /// Lấy diện tích đã thuê (RequestedArea) của renter cho một kho cụ thể.
    /// Dùng để giới hạn sức chứa khi nhập kho.
    /// </summary>
    Task<double> GetContractedAreaAsync(int renterId, int warehouseId, CancellationToken ct = default);
}
