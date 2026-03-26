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
    /// Auto cancel contracts PENDING_SIGNATURE that expired (48h)
    /// </summary>
    public async Task CancelExpiredSignatures()
    {
        var now = DateTime.UtcNow;
        var expiredContracts = await _db.RentalContracts
            .Where(c => c.Status == RentalContractStatus.PendingSignature
                        && c.PendingSignatureExpiry.HasValue
                        && c.PendingSignatureExpiry.Value < now)
            .ToListAsync();

        _logger.LogInformation("Found {Count} expired signature contracts", expiredContracts.Count);

        foreach (var contract in expiredContracts)
        {
            contract.Cancel("Hợp đồng đã hết hạn ký (quá 48 giờ)");
            _logger.LogInformation("Cancelled contract {ContractId} due to signature expiry", contract.ContractId);
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

        await CancelExpiredSignatures();
        await CancelExpiredPayments();
        await CompleteExpiredContracts();
        await MarkOverdueReturns();

        _logger.LogInformation("Finished contract expiry processing");
    }
}
