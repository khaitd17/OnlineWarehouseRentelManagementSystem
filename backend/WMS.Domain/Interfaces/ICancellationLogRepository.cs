using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface ICancellationLogRepository
{
    Task<CancellationLog?> GetByIdAsync(int logId);
    Task<IEnumerable<CancellationLog>> GetByRequestIdAsync(int requestId);
    Task<IEnumerable<CancellationLog>> GetByContractIdAsync(int contractId);
    Task<IEnumerable<CancellationLog>> GetAllAsync(int pageNumber = 1, int pageSize = 20);
    Task<CancellationLog> AddAsync(CancellationLog log);
    Task<int> CountAsync();
}
