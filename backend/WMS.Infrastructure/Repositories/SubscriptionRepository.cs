using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Repositories;

public class SubscriptionRepository : ISubscriptionRepository
{
    private readonly ApplicationDbContext _db;

    public SubscriptionRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<Subscription?> GetByIdAsync(int id)
    {
        return await _db.Subscriptions.FindAsync(id);
    }

    public async Task<Subscription?> GetByTransactionCodeAsync(string transactionCode)
    {
        return await _db.Subscriptions.FirstOrDefaultAsync(s => s.TransactionReference == transactionCode);
    }

    public async Task<List<Subscription>> GetExpiredSubscriptionsAsync(DateTime threshold)
    {
        return await _db.Subscriptions
            .Where(s => s.Status == SubscriptionStatus.Active && s.EndDate.HasValue && s.EndDate.Value < threshold)
            .ToListAsync();
    }

    public async Task AddAsync(Subscription subscription)
    {
        await _db.Subscriptions.AddAsync(subscription);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateAsync(Subscription subscription)
    {
        _db.Subscriptions.Update(subscription);
        await _db.SaveChangesAsync();
    }

    public async Task<bool> ExistsPendingTransactionAsync(string transactionCode)
    {
        return await _db.Subscriptions.AnyAsync(s => s.TransactionReference == transactionCode && s.Status == SubscriptionStatus.Pending);
    }

    public async Task<Subscription?> GetActiveByUserAsync(int userId)
    {
        return await _db.Subscriptions
            .Where(s => s.UserId == userId
                     && s.Status == SubscriptionStatus.Active
                     && s.EndDate.HasValue
                     && s.EndDate.Value > DateTime.UtcNow)
            .OrderByDescending(s => s.EndDate)
            .FirstOrDefaultAsync();
    }

    public async Task CancelAllPendingAsync(int userId)
    {
        var pendings = await _db.Subscriptions
            .Where(s => s.UserId == userId && s.Status == SubscriptionStatus.Pending)
            .ToListAsync();

        foreach (var p in pendings)
            p.Status = SubscriptionStatus.Cancelled;

        if (pendings.Any())
            await _db.SaveChangesAsync();
    }
}
