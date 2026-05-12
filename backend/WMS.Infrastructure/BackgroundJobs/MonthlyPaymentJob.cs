using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.BackgroundJobs;

/// <summary>
/// Background job that creates monthly payment records for active contracts
/// Runs daily to check for upcoming payment due dates
/// </summary>
public class MonthlyPaymentJob
{
    private readonly ApplicationDbContext _context;
    private readonly INotificationRepository _notificationRepository;
    private readonly IEmailService _emailService;
    private readonly ILogger<MonthlyPaymentJob> _logger;

    public MonthlyPaymentJob(
        ApplicationDbContext context,
        INotificationRepository notificationRepository,
        IEmailService emailService,
        ILogger<MonthlyPaymentJob> logger)
    {
        _context = context;
        _notificationRepository = notificationRepository;
        _emailService = emailService;
        _logger = logger;
    }

    /// <summary>
    /// Creates payment records for active contracts that need monthly payments
    /// </summary>
    public async Task CreateUpcomingPayments()
    {
        _logger.LogInformation("Starting MonthlyPaymentJob...");

        var now = DateTime.UtcNow;
        var advanceNoticeDays = 5; // Create payment 5 days before due date
        var createdCount = 0;

        // Find active contracts
        var activeContracts = await _context.RentalContracts
            .Include(c => c.Renter)
            .Include(c => c.Warehouse)
            .Include(c => c.PaymentTerm)
            .Where(c => c.Status == RentalContractStatus.Active)
            .ToListAsync();

        foreach (var contract in activeContracts)
        {
            try
            {
                // Calculate next payment due date based on contract start date
                var nextDueDate = CalculateNextPaymentDueDate(contract);

                if (nextDueDate == null)
                {
                    continue;
                }

                // Check if payment is due within advance notice period
                if (nextDueDate.Value > now.AddDays(advanceNoticeDays))
                {
                    continue;
                }

                // To prevent duplicate bills for the same period, we check if there's any payment
                // created within the last 15 days, or just check the total number of payments.
                var existingPayment = await _context.RentalPayments
                    .OrderByDescending(p => p.CreatedAt)
                    .FirstOrDefaultAsync(p => p.ContractId == contract.ContractId && p.PaymentType == "MONTHLY");

                if (existingPayment != null)
                {
                    // If the most recent payment was created recently (e.g. within the last 15 days), 
                    // it means we already generated the bill for this upcoming cycle.
                    if ((now - existingPayment.CreatedAt).TotalDays < 15)
                    {
                        continue;
                    }
                }

                var overdueDays = contract.PaymentTerm?.AllowedOverdueDays ?? 7;

                // Create new monthly payment
                var payment = RentalPayment.Create(
                    contractId: contract.ContractId,
                    amount: contract.MonthlyPayment * (contract.PaymentTerm?.MonthsPerTerm ?? 1),
                    paymentType: "MONTHLY",
                    expiryHours: overdueDays * 24
                );

                _context.RentalPayments.Add(payment);

                // Notify renter
                var notification = Notification.Create(
                    receiverUserId: contract.RenterId,
                    title: "Kỳ thanh toán mới",
                    message: $"Thanh toán {contract.MonthlyPayment:N0} VNĐ cho hợp đồng {contract.ContractNumber} đến hạn vào {nextDueDate.Value:dd/MM/yyyy}",
                    notificationType: "IN_APP",
                    referenceId: contract.ContractId,
                    referenceType: "RentalContract"
                );
                await _notificationRepository.AddAsync(notification);

                // Send email reminder
                if (contract.Renter != null)
                {
                    try
                    {
                        await _emailService.SendPaymentReminderAsync(
                            contract.Renter.Email,
                            contract.Renter.FullName,
                            contract.Warehouse?.Name ?? "Không xác định",
                            contract.ContractNumber,
                            contract.MonthlyPayment,
                            nextDueDate.Value
                        );
                    }
                    catch (Exception emailEx)
                    {
                        _logger.LogWarning(emailEx, "Failed to send payment reminder email for contract {ContractId}", contract.ContractId);
                    }
                }

                createdCount++;
                _logger.LogInformation("Created monthly payment for contract {ContractId}, due {DueDate}", contract.ContractId, nextDueDate.Value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating monthly payment for contract {ContractId}", contract.ContractId);
            }
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("MonthlyPaymentJob completed. Created {Count} payments.", createdCount);
    }

    /// <summary>
    /// Sends reminders for overdue payments (using ExpiredAt as due date)
    /// </summary>
    public async Task SendOverdueReminders()
    {
        _logger.LogInformation("Checking for overdue payments...");

        var now = DateTime.UtcNow;

        var overduePayments = await _context.RentalPayments
            .Include(p => p.Contract)
            .ThenInclude(c => c!.Renter)
            .Include(p => p.Contract)
            .ThenInclude(c => c!.Warehouse)
            .Where(p => p.Status == PaymentStatus.Pending
                     && p.ExpiredAt.HasValue
                     && p.ExpiredAt.Value < now)
            .ToListAsync();

        foreach (var payment in overduePayments)
        {
            try
            {
                var contract = payment.Contract;
                if (contract?.Renter == null) continue;

                var daysOverdue = (int)(now - payment.ExpiredAt!.Value).TotalDays;

                var notification = Notification.Create(
                    receiverUserId: contract.RenterId,
                    title: "⚠️ Thanh toán quá hạn",
                    message: $"Thanh toán {payment.Amount:N0} VNĐ cho hợp đồng {contract.ContractNumber} đã quá hạn {daysOverdue} ngày. Vui lòng thanh toán ngay.",
                    notificationType: "IN_APP",
                    referenceId: payment.PaymentId,
                    referenceType: "RentalPayment"
                );
                await _notificationRepository.AddAsync(notification);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending overdue reminder for payment {PaymentId}", payment.PaymentId);
            }
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Sent {Count} overdue payment reminders.", overduePayments.Count);
    }

    private DateTime? CalculateNextPaymentDueDate(RentalContract contract)
    {
        var startDate = contract.StartDate;
        var now = DateTime.UtcNow;

        if (startDate > now)
            return null;

        int monthsPerTerm = contract.PaymentTerm?.MonthsPerTerm ?? 1;

        // Tính tổng số tháng chênh lệch theo lịch
        int monthsSinceStart = ((now.Year - startDate.Year) * 12) + now.Month - startDate.Month;

        // Hàm AddMonths xử lý hoàn hảo trường hợp cuối tháng (VD: 31/1 -> 28/2 -> 31/3)
        var currentAnniversary = startDate.AddMonths(monthsSinceStart);

        // Nếu ngày/giờ hiện tại nhỏ hơn ngày mốc kỷ niệm trong tháng này, lùi lại 1 tháng
        if (now.Date < currentAnniversary.Date)
        {
            monthsSinceStart--;
        }

        // Xác định chúng ta đang ở kỳ thanh toán thứ mấy
        int currentTermIndex = monthsSinceStart / monthsPerTerm;

        // Tính mốc ngày đến hạn của kỳ tiếp theo
        int nextTermStartMonths = (currentTermIndex + 1) * monthsPerTerm;
        var nextDue = startDate.AddMonths(nextTermStartMonths);

        if (nextDue > contract.EndDate)
        {
            return null;
        }

        return nextDue;
    }
}
