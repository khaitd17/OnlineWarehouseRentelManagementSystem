using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;
using SystemTask = System.Threading.Tasks.Task;

namespace WMS.Infrastructure.Repositories;

public class RentalContractRepository : IRentalContractRepository
{
    private readonly ApplicationDbContext _context;

    public RentalContractRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<RentalContract?> GetByIdAsync(int contractId)
    {
        return await _context.RentalContracts
            .Include(c => c.RentalRequest)
                .ThenInclude(r => r.Renter)
            .Include(c => c.Warehouse)
            .FirstOrDefaultAsync(c => c.ContractId == contractId);
    }

    public async Task<RentalContract?> GetByRentalRequestIdAsync(int requestId)
    {
        return await _context.RentalContracts
            .Include(c => c.RentalRequest)
                .ThenInclude(r => r.Renter)
            .Include(c => c.Warehouse)
            .FirstOrDefaultAsync(c => c.RentalRequestId == requestId);
    }

    public async Task<List<RentalContract>> GetMyContractsAsync(
        int renterId,
        int pageNumber = 1,
        int pageSize = 10,
        string? status = null)
    {
        var query = _context.RentalContracts
            .Include(c => c.RentalRequest)
                .ThenInclude(r => r.Renter)
            .Include(c => c.Warehouse)
            .Where(c => c.RenterId == renterId);

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(c => c.Status == status);
        }

        return await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<List<RentalContract>> GetContractsByWarehouseAsync(int warehouseId)
    {
        return await _context.RentalContracts
            .Include(c => c.RentalRequest)
                .ThenInclude(r => r.Renter)
            .Include(c => c.Warehouse)
            .Where(c => c.WarehouseId == warehouseId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<int> CountMyContractsAsync(int renterId, string? status = null)
    {
        var query = _context.RentalContracts.Where(c => c.RenterId == renterId);

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(c => c.Status == status);
        }

        return await query.CountAsync();
    }

    public async Task<int> AddAsync(RentalContract contract)
    {
        var result = await _context.RentalContracts.AddAsync(contract);
        await _context.SaveChangesAsync();
        return result.Entity.ContractId;
    }

    public async Task<IEnumerable<RentalContract>> GetByRenterIdAsync(int renterId)
    {
        return await _context.RentalContracts
            .Include(c => c.RentalRequest)
                .ThenInclude(r => r.Renter)
            .Include(c => c.Warehouse)
            .Where(c => c.RenterId == renterId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<RentalContract>> GetByWarehouseIdAsync(int warehouseId)
    {
        return await _context.RentalContracts
            .Include(c => c.RentalRequest)
                .ThenInclude(r => r.Renter)
            .Include(c => c.Warehouse)
            .Where(c => c.WarehouseId == warehouseId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<RentalContract>> GetActiveContractsAsync()
    {
        return await _context.RentalContracts
            .Include(c => c.RentalRequest)
                .ThenInclude(r => r.Renter)
            .Include(c => c.Warehouse)
            .Where(c => c.Status == "ACTIVE")
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async SystemTask UpdateAsync(RentalContract contract)
    {
        _context.RentalContracts.Update(contract);
        await _context.SaveChangesAsync();
    }

    public async SystemTask DeleteAsync(RentalContract contract)
    {
        _context.RentalContracts.Remove(contract);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> ExistsAsync(int contractId)
    {
        return await _context.RentalContracts.AnyAsync(c => c.ContractId == contractId);
    }

    public async Task<List<RentalContract>> GetByOwnerIdAsync(int ownerId)
    {
        return await _context.RentalContracts
            .Include(c => c.RentalRequest)
                .ThenInclude(r => r.Renter)
            .Include(c => c.Warehouse)
            .Where(c => c.Warehouse.OwnerId == ownerId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    // New methods for updated rental flow

    public async Task<List<RentalContract>> GetPagedAsync(
        int pageNumber = 1,
        int pageSize = 10,
        int? userId = null,
        string? status = null,
        DateTime? startDateFrom = null,
        DateTime? startDateTo = null)
    {
        var query = _context.RentalContracts.AsQueryable();

        if (userId.HasValue)
        {
            query = query.Where(c => c.RenterId == userId);
        }

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(c => c.Status == status);
        }

        if (startDateFrom.HasValue)
        {
            query = query.Where(c => c.StartDate >= startDateFrom.Value);
        }

        if (startDateTo.HasValue)
        {
            query = query.Where(c => c.StartDate <= startDateTo.Value);
        }

        return await query
            .Include(c => c.RentalRequest)
                .ThenInclude(r => r.Renter)
            .Include(c => c.Warehouse)
            .OrderByDescending(c => c.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> CountAsync(
        int? userId = null,
        string? status = null,
        DateTime? startDateFrom = null,
        DateTime? startDateTo = null)
    {
        var query = _context.RentalContracts.AsQueryable();

        if (userId.HasValue)
        {
            query = query.Where(c => c.RenterId == userId);
        }

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(c => c.Status == status);
        }

        if (startDateFrom.HasValue)
        {
            query = query.Where(c => c.StartDate >= startDateFrom.Value);
        }

        if (startDateTo.HasValue)
        {
            query = query.Where(c => c.StartDate <= startDateTo.Value);
        }

        return await query.CountAsync();
    }

    public async Task<List<RentalContract>> GetExpiredContractsAsync()
    {
        return await _context.RentalContracts
            .Where(c => c.Status == "ACTIVE" && c.EndDate < DateTime.UtcNow)
            .ToListAsync();
    }

    public async Task<List<RentalContract>> GetPendingSignatureExpiredAsync()
    {
        return await _context.RentalContracts
            .Where(c => c.Status == "PENDING_SIGNATURE" &&
                       c.PendingSignatureExpiry != null &&
                       c.PendingSignatureExpiry < DateTime.UtcNow)
            .ToListAsync();
    }

    public async Task<List<RentalContract>> GetPendingPaymentExpiredAsync()
    {
        return await _context.RentalContracts
            .Where(c => c.Status == "PENDING_PAYMENT" &&
                       c.PendingPaymentExpiry != null &&
                       c.PendingPaymentExpiry < DateTime.UtcNow)
            .ToListAsync();
    }

    public async Task<List<RentalContract>> GetOverdueContractsAsync()
    {
        var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);
        return await _context.RentalContracts
            .Where(c => c.Status == "COMPLETED" &&
                       c.ReturnedAt == null &&
                       c.EndDate < sevenDaysAgo)
            .ToListAsync();
    }

    public async Task<List<RentalContract>> GetContractsNearingExpiry(int daysBeforeExpiry)
    {
        var targetDate = DateTime.UtcNow.AddDays(daysBeforeExpiry);
        return await _context.RentalContracts
            .Include(c => c.RentalRequest)
                .ThenInclude(r => r.Renter)
            .Include(c => c.Warehouse)
            .Where(c => c.Status == "ACTIVE" && c.EndDate.Date == targetDate.Date)
            .ToListAsync();
    }
}