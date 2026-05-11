using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface IContractRevisionThreadRepository
{
    Task<int> AddAsync(ContractRevisionThread thread);
    Task UpdateAsync(ContractRevisionThread thread);
    Task<ContractRevisionThread?> GetByIdAsync(int threadId);
    Task<List<ContractRevisionThread>> GetByContractIdAsync(int contractId);
}
