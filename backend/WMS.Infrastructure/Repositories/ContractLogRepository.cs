using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Repositories;

public class ContractLogRepository : IContractLogRepository
{
    private readonly ApplicationDbContext _context;

    public ContractLogRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<int> AddAsync(ContractLog log)
    {
        _context.ContractLogs.Add(log);
        await _context.SaveChangesAsync();
        return log.LogId;
    }

    public async Task<List<ContractLog>> GetByContractIdAsync(int contractId)
    {
        return await _context.ContractLogs
            .Where(l => l.ContractId == contractId)
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync();
    }
}
