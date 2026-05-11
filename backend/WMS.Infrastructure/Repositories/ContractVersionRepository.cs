using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Repositories;

public class ContractVersionRepository : IContractVersionRepository
{
    private readonly ApplicationDbContext _context;

    public ContractVersionRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<int> AddAsync(ContractVersion version)
    {
        _context.ContractVersions.Add(version);
        await _context.SaveChangesAsync();
        return version.VersionId;
    }

    public async Task<List<ContractVersion>> GetByContractIdAsync(int contractId)
    {
        return await _context.ContractVersions
            .Where(v => v.ContractId == contractId)
            .OrderBy(v => v.VersionNumber)
            .ToListAsync();
    }
}
