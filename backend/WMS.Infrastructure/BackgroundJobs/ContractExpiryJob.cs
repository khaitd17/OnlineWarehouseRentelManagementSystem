using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WMS.Domain.Enums;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.BackgroundJobs;

public class ContractExpiryJob
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<ContractExpiryJob> _logger;

    public ContractExpiryJob(ApplicationDbContext db, ILogger<ContractExpiryJob> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Auto cancel contracts PENDING_OWNER_SIGNATURE that expired (48h)
    /// </summary>
    public async Task CancelExpiredOwnerSignatures()
    {
        var now = DateTime.UtcNow;
        var expiredContracts = await _db.RentalContracts
            .Where(c => c.Status == RentalContractStatus.PendingOwnerSignature
                        && c.OwnerSignatureExpiry.HasValue
                        && c.OwnerSignatureExpiry.Value < now)
            .ToListAsync();

        _logger.LogInformation("Found {Count} expired owner signature contracts", expiredContracts.Count);

        foreach (var contract in expiredContracts)
        {
            contract.Cancel("Owner không ký trong 48 giờ - hợp đồng tự động hủy");

            // Also cancel the extension if exists
            var extension = await _db.ContractExtensions
                .FirstOrDefaultAsync(e => e.NewContractId == contract.ContractId);
            if (extension != null)
            {
                extension.Cancel();
                _logger.LogInformation("Cancelled extension {ExtensionId} due to owner signature expiry", extension.ExtensionId);
            }

            _logger.LogInformation("Cancelled contract {ContractId} due to owner signature expiry", contract.ContractId);
        }

        if (expiredContracts.Any())
        {
            await _db.SaveChangesAsync();
        }
    }

    /// <summary>
    /// Auto cancel contracts PENDING_RENTER_SIGNATURE that expired (48h)
    /// </summary>
    public async Task CancelExpiredSignatures()
    {
        var now = DateTime.UtcNow;
        var expiredContracts = await _db.RentalContracts
            .Where(c => c.Status == RentalContractStatus.PendingRenterSignature
                        && c.PendingSignatureExpiry.HasValue
                        && c.PendingSignatureExpiry.Value < now)
            .ToListAsync();

        _logger.LogInformation("Found {Count} expired signature contracts", expiredContracts.Count);

        foreach (var contract in expiredContracts)
        {
            contract.Cancel("Người thuê không ký trong 48 giờ - hợp đồng tự động hủy");
            _logger.LogInformation("Cancelled contract {ContractId} due to renter signature expiry", contract.ContractId);
        }

        if (expiredContracts.Any())
        {
            await _db.SaveChangesAsync();
        }
    }

    /// <summary>
    /// Auto cancel contracts PENDING_PAYMENT that expired (48h)
    /// </summary>
    public async Task CancelExpiredPayments()
    {
        var now = DateTime.UtcNow;
        var expiredContracts = await _db.RentalContracts
            .Where(c => c.Status == RentalContractStatus.PendingPayment
                        && c.PendingPaymentExpiry.HasValue
                        && c.PendingPaymentExpiry.Value < now)
            .ToListAsync();

        _logger.LogInformation("Found {Count} expired payment contracts", expiredContracts.Count);

        foreach (var contract in expiredContracts)
        {
            contract.Cancel("Hợp đồng đã hết hạn thanh toán (quá 48 giờ)");

            // Cancel pending payments
            var pendingPayments = await _db.RentalPayments
                .Where(p => p.ContractId == contract.ContractId && p.Status == PaymentStatus.Pending)
                .ToListAsync();

            foreach (var payment in pendingPayments)
            {
                payment.MarkExpired();
            }

            _logger.LogInformation("Cancelled contract {ContractId} due to payment expiry", contract.ContractId);
        }

        if (expiredContracts.Any())
        {
            await _db.SaveChangesAsync();
        }
    }

    /// <summary>
    /// Auto complete contracts when EndDate passed
    /// </summary>
    public async Task CompleteExpiredContracts()
    {
        var today = DateTime.UtcNow.Date;
        var expiredContracts = await _db.RentalContracts
            .Where(c => c.Status == RentalContractStatus.Active
                        && c.EndDate.Date < today)
            .ToListAsync();

        _logger.LogInformation("Found {Count} contracts that reached end date", expiredContracts.Count);

        foreach (var contract in expiredContracts)
        {
            contract.Complete();
            _logger.LogInformation("Completed contract {ContractId}", contract.ContractId);
        }

        if (expiredContracts.Any())
        {
            await _db.SaveChangesAsync();
        }
    }

    /// <summary>
    /// Mark contracts OVERDUE if not returned after 7 days of completion
    /// </summary>
    public async Task MarkOverdueReturns()
    {
        var overdueDate = DateTime.UtcNow.AddDays(-7);
        var overdueContracts = await _db.RentalContracts
            .Where(c => c.Status == RentalContractStatus.Completed
                        && c.UpdatedAt.HasValue
                        && c.UpdatedAt.Value < overdueDate)
            .ToListAsync();

        _logger.LogInformation("Found {Count} overdue return contracts", overdueContracts.Count);

        foreach (var contract in overdueContracts)
        {
            contract.MarkOverdue();
            _logger.LogInformation("Marked contract {ContractId} as OVERDUE", contract.ContractId);
        }

        if (overdueContracts.Any())
        {
            await _db.SaveChangesAsync();
        }
    }

    /// <summary>
    /// Run all expiry checks - called by Hangfire recurring job
    /// </summary>
    public async Task ProcessAllExpiries()
    {
        _logger.LogInformation("Starting contract expiry processing");

        await CancelExpiredOwnerSignatures();  // Check owner signature timeout first
        await CancelExpiredSignatures();       // Then renter signature timeout
        await CancelExpiredPayments();         // Then payment timeout
        await CompleteExpiredContracts();      // Mark completed if end date passed
        await MarkOverdueReturns();            // Mark overdue if not returned

        _logger.LogInformation("Finished contract expiry processing");
    }
}
