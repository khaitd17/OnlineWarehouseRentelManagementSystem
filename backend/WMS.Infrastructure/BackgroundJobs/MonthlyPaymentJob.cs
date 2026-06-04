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

    // Timezone Viet Nam (UTC+7) — contract dates are stored in VN local time
    private static readonly TimeZoneInfo VnTz =
        TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");

    private static DateTime VnNow => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, VnTz);

    /// <summary>
    /// Creates payment records for active contracts that need monthly payments
    /// </summary>
    public async Task CreateUpcomingPayments()
    {
        _logger.LogInformation("Starting MonthlyPaymentJob...");

        var now = VnNow;
        var advanceNoticeDays = 5; 
        var targetDate = now.AddDays(advanceNoticeDays);
        var createdCount = 0;

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
                var startDate = contract.StartDate;
                if (startDate > targetDate) continue;

                int monthsPerTerm = contract.PaymentTerm?.MonthsPerTerm ?? 1;
                var overdueDays = contract.PaymentTerm?.AllowedOverdueDays ?? 7;

                // Load all existing term start dates for this contract
                // We use Date component to avoid time-of-day mismatch
                var existingTermDates = await _context.RentalPayments
                    .Where(p => p.ContractId == contract.ContractId && p.TermStartDate != null)
                    .Select(p => p.TermStartDate!.Value.Date)
                    .ToListAsync();

                int termIndex = 0;
                while (true)
                {
                    var termStartDate = startDate.AddMonths(termIndex * monthsPerTerm);
                    
                    // Stop if this term hasn't reached the generation window yet
                    if (termStartDate >= contract.EndDate || termStartDate > targetDate) 
                    {
                        break;
                    }

                    var termEndDate = termStartDate.AddMonths(monthsPerTerm);
                    if (termEndDate > contract.EndDate) 
                    {
                        termEndDate = contract.EndDate;
                    }

                    // Break if term length is 0 or negative
                    if (termStartDate >= termEndDate) 
                    {
                        break;
                    }

                    // Check if this specific billing period already has a payment generated
                    if (existingTermDates.Contains(termStartDate.Date))
                    {
                        termIndex++;
                        continue;
                    }

                    // Create bill for this missing/upcoming term
                    var termDays = (termEndDate - termStartDate).Days;
                    decimal calculatedAmount;

                    // Exact full term logic vs prorated
                    if (termEndDate == startDate.AddMonths((termIndex + 1) * monthsPerTerm))
                    {
                        calculatedAmount = contract.MonthlyPayment * monthsPerTerm;
                    }
                    else
                    {
                        calculatedAmount = Math.Round((contract.MonthlyPayment / 30m) * termDays, 2);
                    }
                    
                    // If this is the very first term and deposit is required, mark as DEPOSIT
                    var paymentType = (termIndex == 0 && contract.DepositAmount > 0) ? "DEPOSIT" : "MONTHLY";
                    // For Term 0, SignContractHandler should have added DepositAmount, but if it was missed, we add it here
                    var totalAmount = (termIndex == 0) ? calculatedAmount + (contract.DepositAmount ?? 0) : calculatedAmount;

                    var payment = RentalPayment.Create(
                        contractId: contract.ContractId,
                        amount: totalAmount,
                        paymentType: paymentType,
                        expiryHours: overdueDays * 24,
                        termStartDate: termStartDate,
                        termEndDate: termEndDate
                    );

                    _context.RentalPayments.Add(payment);

                    // Notify renter
                    var notification = Notification.Create(
                        receiverUserId: contract.RenterId,
                        title: "Kỳ thanh toán mới",
                        message: $"Thanh toán {totalAmount:N0} VNĐ cho hợp đồng {contract.ContractNumber} đến hạn vào {termStartDate:dd/MM/yyyy}",
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
                                totalAmount,
                                termStartDate
                            );
                        }
                        catch (Exception emailEx)
                        {
                            _logger.LogWarning(emailEx, "Failed to send payment reminder email for contract {ContractId}", contract.ContractId);
                        }
                    }

                    createdCount++;
                    _logger.LogInformation("Created payment for contract {ContractId}, Term {TermIndex}, StartDate {StartDate}", contract.ContractId, termIndex, termStartDate);

                    termIndex++;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing monthly payments for contract {ContractId}", contract.ContractId);
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

        var now = VnNow;

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

}
