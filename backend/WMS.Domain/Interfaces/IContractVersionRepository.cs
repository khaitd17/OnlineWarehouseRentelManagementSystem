using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface IContractVersionRepository
{
    Task<int> AddAsync(ContractVersion version);
    Task<List<ContractVersion>> GetByContractIdAsync(int contractId);
}
