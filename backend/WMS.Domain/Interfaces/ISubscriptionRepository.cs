using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface ISubscriptionRepository
{
    Task<Subscription?> GetByIdAsync(int id);
    Task<Subscription?> GetByTransactionCodeAsync(string transactionCode);
    Task<List<Subscription>> GetExpiredSubscriptionsAsync(DateTime threshold);
    Task AddAsync(Subscription subscription);
    Task UpdateAsync(Subscription subscription);
    Task<bool> ExistsPendingTransactionAsync(string transactionCode);
}
