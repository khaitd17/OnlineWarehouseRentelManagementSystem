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
        var advanceNoticeDays = 7; // Create payment 7 days before due date
        var createdCount = 0;

        // Find active contracts
        var activeContracts = await _context.RentalContracts
            .Include(c => c.Renter)
            .Include(c => c.Warehouse)
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

                // Check if payment already exists for this period (use CreatedAt month instead of DueDate)
                var paymentMonth = nextDueDate.Value.Month;
                var paymentYear = nextDueDate.Value.Year;
                var existingPayment = await _context.RentalPayments
                    .FirstOrDefaultAsync(p => p.ContractId == contract.ContractId
                                           && p.PaymentType == "MONTHLY"
                                           && p.CreatedAt.Month == paymentMonth
                                           && p.CreatedAt.Year == paymentYear);

                if (existingPayment != null)
                {
                    continue;
                }

                // Create new monthly payment
                var payment = RentalPayment.Create(
                    contractId: contract.ContractId,
                    amount: contract.MonthlyPayment,
                    paymentType: "MONTHLY",
                    expiryHours: 168 // 7 days to pay
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

        // Skip if contract hasn't started yet
        if (startDate > now)
            return null;

        // Find the next payment due date (monthly on the same day as start date)
        var currentMonth = new DateTime(now.Year, now.Month, 1);
        var dayOfPayment = Math.Min(startDate.Day, DateTime.DaysInMonth(currentMonth.Year, currentMonth.Month));
        var nextDue = new DateTime(currentMonth.Year, currentMonth.Month, dayOfPayment);

        // If we've passed this month's due date, use next month
        if (nextDue <= now)
        {
            currentMonth = currentMonth.AddMonths(1);
            dayOfPayment = Math.Min(startDate.Day, DateTime.DaysInMonth(currentMonth.Year, currentMonth.Month));
            nextDue = new DateTime(currentMonth.Year, currentMonth.Month, dayOfPayment);
        }

        // Check if contract has ended
        if (nextDue > contract.EndDate)
        {
            return null;
        }

        return nextDue;
    }
}
