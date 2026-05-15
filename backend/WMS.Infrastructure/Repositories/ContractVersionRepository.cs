using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
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
        try
        {
            _context.ContractVersions.Add(version);
            await _context.SaveChangesAsync();
            return version.VersionId;
        }
        catch (Exception ex) when (IsMissingContractVersionsTable(ex))
        {
            return 0;
        }
    }

    public async Task<List<ContractVersion>> GetByContractIdAsync(int contractId)
    {
        try
        {
            return await _context.ContractVersions
                .Where(v => v.ContractId == contractId)
                .OrderBy(v => v.VersionNumber)
                .ToListAsync();
        }
        catch (Exception ex) when (IsMissingContractVersionsTable(ex))
        {
            return new List<ContractVersion>();
        }
    }

    private static bool IsMissingContractVersionsTable(Exception ex)
    {
        if (ex is SqlException sqlEx)
        {
            return sqlEx.Number == 208 &&
                   sqlEx.Message.Contains("contract_versions", StringComparison.OrdinalIgnoreCase);
        }

        if (ex is DbUpdateException dbUpdateEx && dbUpdateEx.InnerException is SqlException innerSqlEx)
        {
            return innerSqlEx.Number == 208 &&
                   innerSqlEx.Message.Contains("contract_versions", StringComparison.OrdinalIgnoreCase);
        }

        return false;
    }
}
