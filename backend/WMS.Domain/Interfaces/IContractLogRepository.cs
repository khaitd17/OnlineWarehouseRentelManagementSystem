using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface IContractLogRepository
{
    Task<int> AddAsync(ContractLog log);
    Task<List<ContractLog>> GetByContractIdAsync(int contractId);
}
