using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface IRefundRepository
{
    Task<Refund?> GetByIdAsync(int refundId);
    Task<Refund?> GetByIdWithDetailsAsync(int refundId);
    Task<IEnumerable<Refund>> GetByContractIdAsync(int contractId);
    Task<IEnumerable<Refund>> GetByPaymentIdAsync(int paymentId);
    Task<IEnumerable<Refund>> GetPendingAsync();
    Task<IEnumerable<Refund>> GetAllAsync(int pageNumber = 1, int pageSize = 20);
    Task<IEnumerable<Refund>> GetByStatusAsync(string status, int pageNumber = 1, int pageSize = 20);
    Task<IEnumerable<Refund>> GetAllWithDetailsAsync(string? status, int pageNumber = 1, int pageSize = 20);
    Task<Refund> AddAsync(Refund refund);
    Task UpdateAsync(Refund refund);
    Task<int> CountAsync();
    Task<int> CountByStatusAsync(string? status);
}
