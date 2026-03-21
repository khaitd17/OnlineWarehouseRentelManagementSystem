using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Enums;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.BackgroundJobs;

public class ContractNotificationJob
{
    private readonly ApplicationDbContext _db;
    private readonly INotificationSender _notificationSender;
    private readonly ILogger<ContractNotificationJob> _logger;

    public ContractNotificationJob(
        ApplicationDbContext db,
        INotificationSender notificationSender,
        ILogger<ContractNotificationJob> logger)
    {
        _db = db;
        _notificationSender = notificationSender;
        _logger = logger;
    }

    /// <summary>
    /// Send notifications for contracts expiring in 30 days
    /// </summary>
    public async Task SendExpiryNotifications()
    {
        var today = DateTime.UtcNow.Date;
        var in30Days = today.AddDays(30);
        var in7Days = today.AddDays(7);
        var in1Day = today.AddDays(1);

        // 30 days notice
        await SendNotificationsForDate(in30Days, "30 ngày");

        // 7 days notice
        await SendNotificationsForDate(in7Days, "7 ngày");

        // 1 day notice
        await SendNotificationsForDate(in1Day, "1 ngày");

        _logger.LogInformation("Finished sending expiry notifications");
    }

    private async Task SendNotificationsForDate(DateTime expiryDate, string timeframe)
    {
        var contracts = await _db.RentalContracts
            .Where(c => c.Status == RentalContractStatus.Active
                        && c.EndDate.Date == expiryDate)
            .ToListAsync();

        _logger.LogInformation("Found {Count} contracts expiring in {Timeframe}", contracts.Count, timeframe);

        foreach (var contract in contracts)
        {
            // Check if notification already sent today
            var existingNotification = await _db.Notifications
                .AnyAsync(n => n.UserId == contract.RenterId
                               && n.ReferenceId == contract.ContractId
                               && n.ReferenceType == "CONTRACT_EXPIRY"
                               && n.CreatedAt.HasValue
                               && n.CreatedAt.Value.Date == DateTime.UtcNow.Date);

            if (existingNotification)
                continue;

            var notification = new Notification
            {
                UserId = contract.RenterId,
                Title = $"Hợp đồng sắp hết hạn ({timeframe})",
                Message = $"Hợp đồng {contract.ContractNumber} sẽ hết hạn vào {contract.EndDate:dd/MM/yyyy}. " +
                          $"Bạn có muốn gia hạn hợp đồng không?",
                Type = "CONTRACT_EXPIRY",
                ReferenceId = contract.ContractId,
                ReferenceType = "CONTRACT_EXPIRY",
                CreatedAt = DateTime.UtcNow
            };

            _db.Notifications.Add(notification);
            await _db.SaveChangesAsync();

            await _notificationSender.SendToUserAsync(contract.RenterId, notification);

            _logger.LogInformation("Sent expiry notification for contract {ContractId} to user {UserId}",
                contract.ContractId, contract.RenterId);
        }
    }

    /// <summary>
    /// Send payment reminders for pending payments expiring soon
    /// </summary>
    public async Task SendPaymentReminders()
    {
        var in24Hours = DateTime.UtcNow.AddHours(24);
        var pendingPayments = await _db.RentalPayments
            .Include(p => p.Contract)
            .Where(p => p.Status == PaymentStatus.Pending
                        && p.ExpiredAt.HasValue
                        && p.ExpiredAt.Value <= in24Hours
                        && p.ExpiredAt.Value > DateTime.UtcNow)
            .ToListAsync();

        _logger.LogInformation("Found {Count} pending payments expiring in 24h", pendingPayments.Count);

        foreach (var payment in pendingPayments)
        {
            if (payment.Contract == null)
                continue;

            // Check if reminder already sent
            var existingNotification = await _db.Notifications
                .AnyAsync(n => n.UserId == payment.Contract.RenterId
                               && n.ReferenceId == payment.PaymentId
                               && n.ReferenceType == "PAYMENT_REMINDER"
                               && n.CreatedAt.HasValue
                               && n.CreatedAt.Value > DateTime.UtcNow.AddHours(-12));

            if (existingNotification)
                continue;

            var notification = new Notification
            {
                UserId = payment.Contract.RenterId,
                Title = "Nhắc nhở thanh toán",
                Message = $"Thanh toán {payment.PaymentCode} sẽ hết hạn sau 24 giờ. " +
                          $"Vui lòng hoàn tất thanh toán để kích hoạt hợp đồng.",
                Type = "PAYMENT_REMINDER",
                ReferenceId = payment.PaymentId,
                ReferenceType = "PAYMENT_REMINDER",
                CreatedAt = DateTime.UtcNow
            };

            _db.Notifications.Add(notification);
            await _db.SaveChangesAsync();

            await _notificationSender.SendToUserAsync(payment.Contract.RenterId, notification);
        }
    }
}
