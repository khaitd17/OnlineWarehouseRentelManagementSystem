using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.BackgroundJobs;

public class ExpirePaymentsJob
{
    private readonly ApplicationDbContext _context;
    private readonly INotificationRepository _notificationRepository;
    private readonly ICancellationLogRepository _cancellationLogRepository;
    private readonly IEmailService _emailService;
    private readonly ILogger<ExpirePaymentsJob> _logger;

    public ExpirePaymentsJob(
        ApplicationDbContext context,
        INotificationRepository notificationRepository,
        ICancellationLogRepository cancellationLogRepository,
        IEmailService emailService,
        ILogger<ExpirePaymentsJob> logger)
    {
        _context = context;
        _notificationRepository = notificationRepository;
        _cancellationLogRepository = cancellationLogRepository;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task ProcessExpiredPayments()
    {
        _logger.LogInformation("Starting ExpirePaymentsJob...");

        var now = DateTime.UtcNow;
        var expiredCount = 0;

        // Find payments that are expired (48h timeout)
        var expiredPayments = await _context.RentalPayments
            .Include(p => p.Contract)
            .Where(p => p.Status == PaymentStatus.Pending
                     && p.ExpiredAt.HasValue
                     && p.ExpiredAt.Value < now)
            .ToListAsync();

        foreach (var payment in expiredPayments)
        {
            try
            {
                // Mark payment as expired
                payment.MarkExpired();

                // Find associated contract
                var contract = await _context.RentalContracts
                    .Include(c => c.Renter)
                    .Include(c => c.Warehouse)
                    .ThenInclude(w => w!.Owner)
                    .FirstOrDefaultAsync(c => c.ContractId == payment.ContractId);

                if (contract != null && contract.Status == RentalContractStatus.PendingPayment)
                {
                    // Update contract status to cancelled (no payment)
                    var statusProp = contract.GetType().GetProperty("Status");
                    statusProp?.SetValue(contract, RentalContractStatus.CancelledNoPayment);

                    var cancelledAtProp = contract.GetType().GetProperty("CancelledAt");
                    cancelledAtProp?.SetValue(contract, DateTime.UtcNow);

                    var cancelledByProp = contract.GetType().GetProperty("CancelledBy");
                    cancelledByProp?.SetValue(contract, "SYSTEM");

                    var cancellationReasonProp = contract.GetType().GetProperty("CancellationReason");
                    cancellationReasonProp?.SetValue(contract, "Hết hạn thanh toán (48 giờ)");

                    // Log cancellation
                    var cancellationLog = CancellationLog.Create(
                        rentalRequestId: null,
                        rentalContractId: contract.ContractId,
                        cancelledStage: "PAYMENT",
                        cancelledBy: "SYSTEM",
                        cancellationReason: "Hết hạn thanh toán (48 giờ)",
                        refundAmount: null,
                        cancellationFee: null
                    );
                    await _cancellationLogRepository.AddAsync(cancellationLog);

                    // Notify renter
                    var renterNotification = Notification.Create(
                        receiverUserId: contract.RenterId,
                        title: "Hợp đồng đã bị hủy do hết hạn thanh toán",
                        message: $"Hợp đồng {contract.ContractNumber} đã bị hủy do bạn chưa thanh toán trong 48 giờ. Vui lòng tạo yêu cầu mới nếu còn nhu cầu.",
                        notificationType: "IN_APP",
                        referenceId: contract.ContractId,
                        referenceType: "RentalContract"
                    );
                    await _notificationRepository.AddAsync(renterNotification);

                    // Send email to renter
                    if (contract.Renter != null)
                    {
                        try
                        {
                            await _emailService.SendPaymentExpiredAsync(
                                contract.Renter.Email,
                                contract.Renter.FullName,
                                contract.Warehouse?.Name ?? "Không xác định",
                                contract.ContractNumber,
                                payment.Amount
                            );
                        }
                        catch (Exception emailEx)
                        {
                            _logger.LogWarning(emailEx, "Failed to send payment expired email to renter for contract {ContractId}", contract.ContractId);
                        }
                    }

                    // Notify owner
                    if (contract.Warehouse != null)
                    {
                        var ownerNotification = Notification.Create(
                            receiverUserId: contract.Warehouse.OwnerId,
                            title: "Hợp đồng đã bị hủy",
                            message: $"Hợp đồng {contract.ContractNumber} đã bị hủy do người thuê chưa thanh toán trong 48 giờ.",
                            notificationType: "IN_APP",
                            referenceId: contract.ContractId,
                            referenceType: "RentalContract"
                        );
                        await _notificationRepository.AddAsync(ownerNotification);

                        // Send email to owner
                        if (contract.Warehouse.Owner != null)
                        {
                            try
                            {
                                await _emailService.SendPaymentExpiredAsync(
                                    contract.Warehouse.Owner.Email,
                                    contract.Warehouse.Owner.FullName,
                                    contract.Warehouse.Name,
                                    contract.ContractNumber,
                                    payment.Amount
                                );
                            }
                            catch (Exception emailEx)
                            {
                                _logger.LogWarning(emailEx, "Failed to send payment expired email to owner for contract {ContractId}", contract.ContractId);
                            }
                        }
                    }
                }

                expiredCount++;
                _logger.LogInformation($"Expired payment {payment.PaymentId}, code {payment.PaymentCode}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error expiring payment {payment.PaymentId}");
            }
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation($"ExpirePaymentsJob completed. Expired {expiredCount} payments.");
    }

    public async Task SendPaymentExpiryReminders()
    {
        _logger.LogInformation("Sending payment expiry reminders...");

        var now = DateTime.UtcNow;
        var reminderThreshold = now.AddHours(12); // Remind 12h before expiry

        var paymentsNearExpiry = await _context.RentalPayments
            .Include(p => p.Contract)
            .Where(p => p.Status == PaymentStatus.Pending
                     && p.ExpiredAt.HasValue
                     && p.ExpiredAt.Value > now
                     && p.ExpiredAt.Value <= reminderThreshold)
            .ToListAsync();

        foreach (var payment in paymentsNearExpiry)
        {
            try
            {
                var contract = await _context.RentalContracts
                    .Include(c => c.Renter)
                    .Include(c => c.Warehouse)
                    .FirstOrDefaultAsync(c => c.ContractId == payment.ContractId);

                if (contract != null)
                {
                    var hoursRemaining = (int)(payment.ExpiredAt.Value - now).TotalHours;

                    var notification = Notification.Create(
                        receiverUserId: contract.RenterId,
                        title: "Sắp hết hạn thanh toán",
                        message: $"Hợp đồng {contract.ContractNumber} còn {hoursRemaining} giờ để thanh toán. Vui lòng hoàn tất thanh toán để tránh hợp đồng bị hủy.",
                        notificationType: "IN_APP",
                        referenceId: contract.ContractId,
                        referenceType: "RentalContract"
                    );
                    await _notificationRepository.AddAsync(notification);

                    // Send reminder email
                    if (contract.Renter != null)
                    {
                        try
                        {
                            await _emailService.SendPaymentReminderAsync(
                                contract.Renter.Email,
                                contract.Renter.FullName,
                                contract.Warehouse?.Name ?? "Không xác định",
                                contract.ContractNumber,
                                payment.Amount,
                                payment.ExpiredAt!.Value
                            );
                        }
                        catch (Exception emailEx)
                        {
                            _logger.LogWarning(emailEx, "Failed to send payment reminder email for payment {PaymentId}", payment.PaymentId);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending reminder for payment {payment.PaymentId}");
            }
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation($"Sent {paymentsNearExpiry.Count} payment expiry reminders.");
    }
}
