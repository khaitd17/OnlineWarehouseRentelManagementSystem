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
    /// <summary>Lấy gói đang Active còn hiệu lực của user (EndDate > now)</summary>
    Task<Subscription?> GetActiveByUserAsync(int userId);
    /// <summary>Hủy tất cả Pending subscriptions của user (tránh rác DB)</summary>
    Task CancelAllPendingAsync(int userId);
}
