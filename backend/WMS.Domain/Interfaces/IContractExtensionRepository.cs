using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces
{
    public interface IContractExtensionRepository
    {
        Task<ContractExtension?> GetByIdAsync(int extensionId);
        Task<List<ContractExtension>> GetByOriginalContractIdAsync(int originalContractId);
        Task<List<ContractExtension>> GetByStatusAsync(string status);
        Task<List<ContractExtension>> GetListAsync();
        Task<ContractExtension> AddAsync(ContractExtension contractExtension);
        Task UpdateAsync(ContractExtension contractExtension);
        Task DeleteAsync(int extensionId);
        Task<bool> HasPendingExtensionAsync(int originalContractId);

        // New methods for contract extension management
        Task<List<ContractExtension>> GetByRequesterIdAsync(int requesterId);
        Task<List<ContractExtension>> GetPendingByWarehouseIdsAsync(List<int> warehouseIds);
        Task<ContractExtension?> GetPendingByContractIdAsync(int contractId);

        // Get approved extensions where new contract is pending owner signature
        Task<IEnumerable<ContractExtension>> GetApprovedPendingSignatureByWarehouseIdsAsync(IEnumerable<int> warehouseIds);

        // Get completed/processed extensions for tracking
        Task<IEnumerable<ContractExtension>> GetCompletedByWarehouseIdsAsync(IEnumerable<int> warehouseIds);
    }
}