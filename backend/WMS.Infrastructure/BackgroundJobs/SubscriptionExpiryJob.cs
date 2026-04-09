using Microsoft.Extensions.Logging;
using WMS.Domain.Entities;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.BackgroundJobs;

public class SubscriptionExpiryJob
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<SubscriptionExpiryJob> _logger;

    public SubscriptionExpiryJob(ApplicationDbContext db, ILogger<SubscriptionExpiryJob> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task ProcessExpiries()
    {
        _logger.LogInformation("Bắt đầu kiểm tra hết hạn Subscription...");

        var now = DateTime.UtcNow;
        
        // Cập nhật subscription
        var expiredSubscriptions = _db.Subscriptions
            .Where(s => s.Status == SubscriptionStatus.Active && s.EndDate.HasValue && s.EndDate.Value < now)
            .ToList();

        if (!expiredSubscriptions.Any())
        {
            _logger.LogInformation("Không có Subscription nào hết hạn hôm nay.");
            return;
        }

        foreach (var sub in expiredSubscriptions)
        {
            sub.Status = SubscriptionStatus.Expired;
            _logger.LogInformation("Subscription {SubId} của User {UserId} đã chuyển sang hết hạn.", sub.SubscriptionId, sub.UserId);

            // Kiểm tra xem User còn gói nào khác đang Active không (ví dụ họ vừa gia hạn, tạo 1 record Subscription khác)
            // Nếu còn gói Active, KHÔNG khóa kho.
            bool hasOtherActive = _db.Subscriptions.Any(s => s.UserId == sub.UserId && s.Status == SubscriptionStatus.Active && s.SubscriptionId != sub.SubscriptionId);
            
            if (!hasOtherActive)
            {
                // Khóa warehouse
                var userWarehouses = _db.Warehouses.Where(w => w.OwnerId == sub.UserId).ToList();
                foreach (var w in userWarehouses)
                {
                    if (w.Status != "LOCKED")
                    {
                        w.Status = "LOCKED";
                        _logger.LogInformation("Warehouse {WId} ({WName}) đã bị KHÓA do hết hạn gói cước.", w.WarehouseId, w.Name);
                    }
                }
            }
        }

        await _db.SaveChangesAsync();
        _logger.LogInformation("Hoàn tất xử lý Subscription hết hạn.");
    }
}
