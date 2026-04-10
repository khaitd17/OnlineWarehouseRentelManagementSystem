using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.BackgroundJobs;

public class ExpireSignaturesJob
{
    private readonly ApplicationDbContext _context;
    private readonly INotificationRepository _notificationRepository;
    private readonly IEmailService _emailService;
    private readonly ILogger<ExpireSignaturesJob> _logger;

    public ExpireSignaturesJob(
        ApplicationDbContext context,
        INotificationRepository notificationRepository,
        IEmailService emailService,
        ILogger<ExpireSignaturesJob> logger)
    {
        _context = context;
        _notificationRepository = notificationRepository;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task ProcessExpiredSignatures()
    {
        _logger.LogInformation("Starting ExpireSignaturesJob...");

        var now = DateTime.UtcNow;
        var expiredCount = 0;

        // 1. Find contracts with expired owner signature (48h timeout)
        var ownerSignatureExpired = await _context.RentalContracts
            .Include(c => c.Renter)
            .Include(c => c.Warehouse)
            .Where(c => c.Status == RentalContractStatus.PendingOwnerSignature
                     && c.OwnerSignatureExpiry.HasValue
                     && c.OwnerSignatureExpiry.Value < now)
            .ToListAsync();

        foreach (var contract in ownerSignatureExpired)
        {
            try
            {
                // Update status to expired
                var statusProp = contract.GetType().GetProperty("Status");
                statusProp?.SetValue(contract, RentalContractStatus.ExpiredSignature);

                var updatedAtProp = contract.GetType().GetProperty("UpdatedAt");
                updatedAtProp?.SetValue(contract, DateTime.UtcNow);

                // Notify renter
                var notification = Notification.Create(
                    receiverUserId: contract.RenterId,
                    title: "Hợp đồng đã hết hạn ký",
                    message: $"Hợp đồng {contract.ContractNumber} đã hết hạn do chủ kho không ký trong 48 giờ.",
                    notificationType: "IN_APP",
                    referenceId: contract.ContractId,
                    referenceType: "RentalContract"
                );
                await _notificationRepository.AddAsync(notification);

                // Send email to renter
                if (contract.Renter != null)
                {
                    try
                    {
                        await _emailService.SendSignatureExpiredAsync(
                            contract.Renter.Email,
                            contract.Renter.FullName,
                            contract.Warehouse?.Name ?? "Không xác định",
                            contract.ContractNumber
                        );
                    }
                    catch (Exception emailEx)
                    {
                        _logger.LogWarning(emailEx, "Failed to send signature expired email for contract {ContractId}", contract.ContractId);
                    }
                }

                expiredCount++;
                _logger.LogInformation($"Expired owner signature for contract {contract.ContractId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error expiring owner signature for contract {contract.ContractId}");
            }
        }

        // 2. Find contracts with expired renter signature (48h timeout)
        var renterSignatureExpired = await _context.RentalContracts
            .Include(c => c.Renter)
            .Include(c => c.Warehouse)
            .ThenInclude(w => w!.Owner)
            .Where(c => c.Status == RentalContractStatus.PendingRenterSignature
                     && c.RenterSignatureExpiry.HasValue
                     && c.RenterSignatureExpiry.Value < now)
            .ToListAsync();

        foreach (var contract in renterSignatureExpired)
        {
            try
            {
                // Update status to expired
                var statusProp = contract.GetType().GetProperty("Status");
                statusProp?.SetValue(contract, RentalContractStatus.ExpiredSignature);

                var updatedAtProp = contract.GetType().GetProperty("UpdatedAt");
                updatedAtProp?.SetValue(contract, DateTime.UtcNow);

                // Notify both parties
                var renterNotification = Notification.Create(
                    receiverUserId: contract.RenterId,
                    title: "Hợp đồng đã hết hạn ký",
                    message: $"Hợp đồng {contract.ContractNumber} đã hết hạn do bạn chưa ký trong 48 giờ.",
                    notificationType: "IN_APP",
                    referenceId: contract.ContractId,
                    referenceType: "RentalContract"
                );
                await _notificationRepository.AddAsync(renterNotification);

                if (contract.Warehouse != null)
                {
                    var ownerNotification = Notification.Create(
                        receiverUserId: contract.Warehouse.OwnerId,
                        title: "Hợp đồng đã hết hạn",
                        message: $"Hợp đồng {contract.ContractNumber} đã hết hạn do người thuê chưa ký trong 48 giờ.",
                        notificationType: "IN_APP",
                        referenceId: contract.ContractId,
                        referenceType: "RentalContract"
                    );
                    await _notificationRepository.AddAsync(ownerNotification);
                }

                // Send emails
                if (contract.Renter != null)
                {
                    try
                    {
                        await _emailService.SendSignatureExpiredAsync(
                            contract.Renter.Email,
                            contract.Renter.FullName,
                            contract.Warehouse?.Name ?? "Không xác định",
                            contract.ContractNumber
                        );
                    }
                    catch (Exception emailEx)
                    {
                        _logger.LogWarning(emailEx, "Failed to send signature expired email to renter for contract {ContractId}", contract.ContractId);
                    }
                }

                if (contract.Warehouse?.Owner != null)
                {
                    try
                    {
                        await _emailService.SendSignatureExpiredAsync(
                            contract.Warehouse.Owner.Email,
                            contract.Warehouse.Owner.FullName,
                            contract.Warehouse.Name,
                            contract.ContractNumber
                        );
                    }
                    catch (Exception emailEx)
                    {
                        _logger.LogWarning(emailEx, "Failed to send signature expired email to owner for contract {ContractId}", contract.ContractId);
                    }
                }

                expiredCount++;
                _logger.LogInformation($"Expired renter signature for contract {contract.ContractId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error expiring renter signature for contract {contract.ContractId}");
            }
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation($"ExpireSignaturesJob completed. Expired {expiredCount} contracts.");
    }
}
