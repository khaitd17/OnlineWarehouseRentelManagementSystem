using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface IContractRevisionCommentRepository
{
    Task<int> AddAsync(ContractRevisionComment comment);
    Task<List<ContractRevisionComment>> GetByThreadIdAsync(int threadId);
}
