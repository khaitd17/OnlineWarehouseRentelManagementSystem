using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface IRentalPaymentRepository
{
    Task<RentalPayment?> GetByIdAsync(int paymentId);
    Task<RentalPayment?> GetByIdWithDetailsAsync(int paymentId);
    Task<RentalPayment?> GetByPaymentCodeAsync(string paymentCode);
    Task<IEnumerable<RentalPayment>> GetByContractIdAsync(int contractId);
    Task<IEnumerable<RentalPayment>> GetCompletedByContractIdAsync(int contractId);
    Task<RentalPayment?> GetPendingPaymentByContractAsync(int contractId, string paymentType);
    Task<int> AddAsync(RentalPayment payment);
    Task UpdateAsync(RentalPayment payment);
    Task SaveChangesAsync();
}
