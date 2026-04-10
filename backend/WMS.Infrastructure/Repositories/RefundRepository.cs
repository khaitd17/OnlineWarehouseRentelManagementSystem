using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Repositories;

public class RefundRepository : IRefundRepository
{
    private readonly ApplicationDbContext _context;
    
    public RefundRepository(ApplicationDbContext context)
    {
        _context = context;
    }
    
    public async Task<Refund?> GetByIdAsync(int refundId)
    {
        return await _context.Refunds
            .Include(r => r.Payment)
            .Include(r => r.Contract)
            .FirstOrDefaultAsync(r => r.RefundId == refundId);
    }

    public async Task<Refund?> GetByIdWithDetailsAsync(int refundId)
    {
        return await _context.Refunds
            .Include(r => r.Payment)
            .Include(r => r.Contract)
            .ThenInclude(c => c!.Renter)
            .Include(r => r.Contract)
            .ThenInclude(c => c!.Warehouse)
            .FirstOrDefaultAsync(r => r.RefundId == refundId);
    }
    
    public async Task<IEnumerable<Refund>> GetByContractIdAsync(int contractId)
    {
        return await _context.Refunds
            .Where(r => r.ContractId == contractId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }
    
    public async Task<IEnumerable<Refund>> GetByPaymentIdAsync(int paymentId)
    {
        return await _context.Refunds
            .Where(r => r.PaymentId == paymentId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }
    
    public async Task<IEnumerable<Refund>> GetPendingAsync()
    {
        return await _context.Refunds
            .Include(r => r.Contract)
            .Where(r => r.Status == "PENDING")
            .OrderBy(r => r.CreatedAt)
            .ToListAsync();
    }
    
    public async Task<IEnumerable<Refund>> GetAllAsync(int pageNumber = 1, int pageSize = 20)
    {
        return await _context.Refunds
            .Include(r => r.Payment)
            .Include(r => r.Contract)
            .OrderByDescending(r => r.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<IEnumerable<Refund>> GetByStatusAsync(string status, int pageNumber = 1, int pageSize = 20)
    {
        return await _context.Refunds
            .Include(r => r.Payment)
            .Include(r => r.Contract)
            .Where(r => r.Status == status)
            .OrderByDescending(r => r.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<IEnumerable<Refund>> GetAllWithDetailsAsync(string? status, int pageNumber = 1, int pageSize = 20)
    {
        var query = _context.Refunds
            .Include(r => r.Payment)
            .Include(r => r.Contract)
            .ThenInclude(c => c!.Renter)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(r => r.Status == status);
        }

        return await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }
    
    public async Task<Refund> AddAsync(Refund refund)
    {
        _context.Refunds.Add(refund);
        await _context.SaveChangesAsync();
        return refund;
    }
    
    public async Task UpdateAsync(Refund refund)
    {
        _context.Refunds.Update(refund);
        await _context.SaveChangesAsync();
    }
    
    public async Task<int> CountAsync()
    {
        return await _context.Refunds.CountAsync();
    }

    public async Task<int> CountByStatusAsync(string? status)
    {
        var query = _context.Refunds.AsQueryable();
        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(r => r.Status == status);
        }
        return await query.CountAsync();
    }
}
