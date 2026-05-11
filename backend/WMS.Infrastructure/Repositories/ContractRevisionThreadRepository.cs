using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Repositories;

public class ContractRevisionThreadRepository : IContractRevisionThreadRepository
{
    private readonly ApplicationDbContext _context;

    public ContractRevisionThreadRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<int> AddAsync(ContractRevisionThread thread)
    {
        _context.ContractRevisionThreads.Add(thread);
        await _context.SaveChangesAsync();
        return thread.ThreadId;
    }

    public async Task UpdateAsync(ContractRevisionThread thread)
    {
        _context.ContractRevisionThreads.Update(thread);
        await _context.SaveChangesAsync();
    }

    public async Task<ContractRevisionThread?> GetByIdAsync(int threadId)
    {
        return await _context.ContractRevisionThreads
            .FirstOrDefaultAsync(t => t.ThreadId == threadId);
    }

    public async Task<List<ContractRevisionThread>> GetByContractIdAsync(int contractId)
    {
        return await _context.ContractRevisionThreads
            .Where(t => t.ContractId == contractId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }
}
