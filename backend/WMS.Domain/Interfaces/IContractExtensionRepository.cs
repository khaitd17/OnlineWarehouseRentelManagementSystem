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
    }
}