using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Repositories;

public class CancellationLogRepository : ICancellationLogRepository
{
    private readonly ApplicationDbContext _context;
    
    public CancellationLogRepository(ApplicationDbContext context)
    {
        _context = context;
    }
    
    public async Task<CancellationLog?> GetByIdAsync(int logId)
    {
        return await _context.CancellationLogs
            .Include(l => l.RentalRequest)
            .Include(l => l.RentalContract)
            .FirstOrDefaultAsync(l => l.LogId == logId);
    }
    
    public async Task<IEnumerable<CancellationLog>> GetByRequestIdAsync(int requestId)
    {
        return await _context.CancellationLogs
            .Where(l => l.RentalRequestId == requestId)
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync();
    }
    
    public async Task<IEnumerable<CancellationLog>> GetByContractIdAsync(int contractId)
    {
        return await _context.CancellationLogs
            .Where(l => l.RentalContractId == contractId)
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync();
    }
    
    public async Task<IEnumerable<CancellationLog>> GetAllAsync(int pageNumber = 1, int pageSize = 20)
    {
        return await _context.CancellationLogs
            .Include(l => l.RentalRequest)
            .Include(l => l.RentalContract)
            .OrderByDescending(l => l.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }
    
    public async Task<CancellationLog> AddAsync(CancellationLog log)
    {
        _context.CancellationLogs.Add(log);
        await _context.SaveChangesAsync();
        return log;
    }
    
    public async Task<int> CountAsync()
    {
        return await _context.CancellationLogs.CountAsync();
    }
}
