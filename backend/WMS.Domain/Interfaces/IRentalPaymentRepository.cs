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
    /// <summary>Atomically update only the payment_code field without full EF tracking overhead.</summary>
    Task UpdatePaymentCodeAsync(int paymentId, string paymentCode);
    Task SaveChangesAsync();
    Task<bool> HasUnpaidBillsAsync(int renterId, int warehouseId);
}
