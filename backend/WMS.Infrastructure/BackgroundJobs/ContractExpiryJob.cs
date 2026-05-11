using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WMS.Domain.Entities;
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
    /// Auto cancel contracts APPROVED_FOR_SIGNING/PENDING_OWNER_SIGNATURE that expired (48h)
    /// </summary>
    public async Task CancelExpiredOwnerSignatures()
    {
        var now = DateTime.UtcNow;
        
        // Use raw SQL to avoid column mapping issues
        var expiredLimit = DateTime.UtcNow.AddHours(-48);
        var sql = @"
            UPDATE contracts 
            SET status = @CancelledStatus, updated_at = @Now 
            WHERE status IN (@PendingStatus, @ApprovedStatus)
            AND updated_at IS NOT NULL 
            AND updated_at < @ExpiredLimit";
            
        var affected = await _db.Database.ExecuteSqlRawAsync(sql, 
            new Microsoft.Data.SqlClient.SqlParameter("@CancelledStatus", RentalContractStatus.Cancelled),
            new Microsoft.Data.SqlClient.SqlParameter("@PendingStatus", RentalContractStatus.PendingOwnerSignature),
            new Microsoft.Data.SqlClient.SqlParameter("@ApprovedStatus", RentalContractStatus.ApprovedForSigning),
            new Microsoft.Data.SqlClient.SqlParameter("@ExpiredLimit", expiredLimit),
            new Microsoft.Data.SqlClient.SqlParameter("@Now", now));

        _logger.LogInformation("Cancelled {Count} expired owner signature contracts", affected);
    }

    /// <summary>
    /// Auto cancel contracts PENDING_RENTER_SIGNATURE that expired (48h)
    /// </summary>
    public async Task CancelExpiredSignatures()
    {
        var now = DateTime.UtcNow;
        
        var expiredLimit = DateTime.UtcNow.AddHours(-48);
        var sql = @"
            UPDATE contracts 
            SET status = @CancelledStatus, updated_at = @Now 
            WHERE status = @PendingStatus 
            AND updated_at IS NOT NULL 
            AND updated_at < @ExpiredLimit";
            
        var affected = await _db.Database.ExecuteSqlRawAsync(sql, 
            new Microsoft.Data.SqlClient.SqlParameter("@CancelledStatus", RentalContractStatus.Cancelled),
            new Microsoft.Data.SqlClient.SqlParameter("@PendingStatus", RentalContractStatus.PendingRenterSignature),
            new Microsoft.Data.SqlClient.SqlParameter("@ExpiredLimit", expiredLimit),
            new Microsoft.Data.SqlClient.SqlParameter("@Now", now));

        _logger.LogInformation("Cancelled {Count} expired renter signature contracts", affected);
    }

    /// <summary>
    /// Auto cancel contracts PENDING_PAYMENT that expired (48h)
    /// </summary>
    public async Task CancelExpiredPayments()
    {
        var now = DateTime.UtcNow;
        
        var expiredLimit = DateTime.UtcNow.AddHours(-48);
        var sql = @"
            UPDATE contracts 
            SET status = @CancelledStatus, updated_at = @Now 
            WHERE status = @PendingStatus 
            AND updated_at IS NOT NULL 
            AND updated_at < @ExpiredLimit";
            
        var affected = await _db.Database.ExecuteSqlRawAsync(sql, 
            new Microsoft.Data.SqlClient.SqlParameter("@CancelledStatus", RentalContractStatus.Cancelled),
            new Microsoft.Data.SqlClient.SqlParameter("@PendingStatus", RentalContractStatus.PendingPayment),
            new Microsoft.Data.SqlClient.SqlParameter("@ExpiredLimit", expiredLimit),
            new Microsoft.Data.SqlClient.SqlParameter("@Now", now));

        _logger.LogInformation("Cancelled {Count} expired payment contracts", affected);

        // Cancel pending payments separately
        var payments = await _db.RentalPayments
            .Where(p => p.Status == PaymentStatus.Pending)
            .Join(_db.Contracts.Where(c => c.Status == RentalContractStatus.Cancelled), 
                  p => p.ContractId, c => c.ContractId, (p, c) => p)
            .ToListAsync();

        foreach (var payment in payments)
        {
            payment.MarkExpired();
        }

        if (payments.Any())
        {
            await _db.SaveChangesAsync();
        }
    }

    /// <summary>
    /// Auto complete contracts when EndDate passed and deactivate membership
    /// </summary>
    public async Task CompleteExpiredContracts()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var now = DateTime.UtcNow;
        
        // Get expired contract IDs for membership processing  
        var expiredContractIds = await _db.Contracts
            .Where(c => c.Status == RentalContractStatus.Active && c.EndDate < today)
            .Select(c => new { c.ContractId, c.RenterId, c.WarehouseId })
            .ToListAsync();

        if (expiredContractIds.Any())
        {
            // Update status with raw SQL
            var contractIds = string.Join(",", expiredContractIds.Select(c => c.ContractId));
            var sql = $@"
                UPDATE contracts 
                SET status = @CompletedStatus, updated_at = @Now 
                WHERE contract_id IN ({contractIds})";
                
            await _db.Database.ExecuteSqlRawAsync(sql,
                new Microsoft.Data.SqlClient.SqlParameter("@CompletedStatus", RentalContractStatus.Completed),
                new Microsoft.Data.SqlClient.SqlParameter("@Now", now));

            _logger.LogInformation("Completed {Count} expired contracts", expiredContractIds.Count);

            // Deactivate memberships
            foreach (var contract in expiredContractIds)
            {
                await DeactivateRenterMembershipAsync(contract.RenterId, contract.WarehouseId);
            }
        }
    }

    /// <summary>
    /// Deactivate warehouse membership for renter when contract expires.
    /// Only deactivates if user has no other active contracts for the same warehouse.
    /// </summary>
    private async Task DeactivateRenterMembershipAsync(int renterId, int warehouseId)
    {
        try
        {
            // Check if user has other active contracts for this warehouse
            var hasOtherActiveContracts = await _db.Contracts
                .AnyAsync(c => c.RenterId == renterId
                           && c.WarehouseId == warehouseId
                           && c.Status == RentalContractStatus.Active);

            if (hasOtherActiveContracts)
            {
                _logger.LogInformation("Renter {RenterId} has other active contracts in warehouse {WarehouseId}, keeping membership",
                    renterId, warehouseId);
                return;
            }

            // Get RENTER warehouse role
            var renterRole = await _db.WarehouseRoles.FirstOrDefaultAsync(r => r.Code == "RENTER");
            if (renterRole == null)
            {
                _logger.LogWarning("RENTER warehouse role not found");
                return;
            }

            // Find and deactivate membership
            var membership = await _db.WarehouseMemberships
                .FirstOrDefaultAsync(m => m.UserId == renterId
                                       && m.WarehouseId == warehouseId
                                       && m.WarehouseRoleId == renterRole.Id
                                       && m.IsActive);

            if (membership != null)
            {
                membership.IsActive = false;
                _logger.LogInformation("Deactivated RENTER membership {MembershipId} for user {RenterId} in warehouse {WarehouseId}",
                    membership.Id, renterId, warehouseId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to deactivate RENTER membership for user {RenterId} in warehouse {WarehouseId}",
                renterId, warehouseId);
        }
    }

    /// <summary>
    /// Mark contracts OVERDUE if not returned after 7 days of completion
    /// </summary>
    public async Task MarkOverdueReturns()
    {
        var overdueDate = DateTime.UtcNow.AddDays(-7);
        
        var sql = @"
            UPDATE contracts 
            SET status = @OverdueStatus, updated_at = @Now 
            WHERE status = @CompletedStatus 
            AND updated_at IS NOT NULL 
            AND updated_at < @OverdueDate";
            
        var affected = await _db.Database.ExecuteSqlRawAsync(sql,
            new Microsoft.Data.SqlClient.SqlParameter("@OverdueStatus", RentalContractStatus.Overdue),
            new Microsoft.Data.SqlClient.SqlParameter("@CompletedStatus", RentalContractStatus.Completed),
            new Microsoft.Data.SqlClient.SqlParameter("@OverdueDate", overdueDate),
            new Microsoft.Data.SqlClient.SqlParameter("@Now", DateTime.UtcNow));

        _logger.LogInformation("Marked {Count} contracts as OVERDUE", affected);
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
