using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Repositories
{
    public class ContractExtensionRepository : IContractExtensionRepository
    {
        private readonly ApplicationDbContext _context;

        public ContractExtensionRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ContractExtension?> GetByIdAsync(int extensionId)
        {
            return await _context.ContractExtensions
                .Include(e => e.OriginalContract)
                .Include(e => e.NewContract)
                .Include(e => e.Requester)
                .Include(e => e.Reviewer)
                .FirstOrDefaultAsync(e => e.ExtensionId == extensionId);
        }

        public async Task<List<ContractExtension>> GetByOriginalContractIdAsync(int originalContractId)
        {
            return await _context.ContractExtensions
                .Include(e => e.Requester)
                .Include(e => e.Reviewer)
                .Where(e => e.OriginalContractId == originalContractId)
                .OrderByDescending(e => e.RequestedAt)
                .ToListAsync();
        }

        public async Task<List<ContractExtension>> GetByStatusAsync(string status)
        {
            return await _context.ContractExtensions
                .Include(e => e.OriginalContract)
                .Include(e => e.Requester)
                .Where(e => e.Status == status)
                .OrderByDescending(e => e.RequestedAt)
                .ToListAsync();
        }

        public async Task<List<ContractExtension>> GetListAsync()
        {
            return await _context.ContractExtensions
                .Include(e => e.OriginalContract)
                .Include(e => e.Requester)
                .Include(e => e.Reviewer)
                .OrderByDescending(e => e.RequestedAt)
                .ToListAsync();
        }

        public async Task<ContractExtension> AddAsync(ContractExtension contractExtension)
        {
            _context.ContractExtensions.Add(contractExtension);
            await _context.SaveChangesAsync();
            return contractExtension;
        }

        public async Task UpdateAsync(ContractExtension contractExtension)
        {
            _context.ContractExtensions.Update(contractExtension);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int extensionId)
        {
            var entity = await _context.ContractExtensions.FindAsync(extensionId);
            if (entity != null)
            {
                _context.ContractExtensions.Remove(entity);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> HasPendingExtensionAsync(int originalContractId)
        {
            return await _context.ContractExtensions
                .AnyAsync(e => e.OriginalContractId == originalContractId && e.Status == "PENDING");
        }

        public async Task<List<ContractExtension>> GetByRequesterIdAsync(int requesterId)
        {
            return await _context.ContractExtensions
                .Include(e => e.OriginalContract)
                .Include(e => e.Reviewer)
                .Where(e => e.RequesterId == requesterId)
                .OrderByDescending(e => e.RequestedAt)
                .ToListAsync();
        }

        public async Task<List<ContractExtension>> GetPendingByWarehouseIdsAsync(List<int> warehouseIds)
        {
            return await _context.ContractExtensions
                .Include(e => e.OriginalContract)
                .Include(e => e.Requester)
                .Where(e => e.Status == "PENDING"
                    && e.OriginalContract != null
                    && warehouseIds.Contains(e.OriginalContract.WarehouseId))
                .OrderByDescending(e => e.RequestedAt)
                .ToListAsync();
        }

        public async Task<ContractExtension?> GetPendingByContractIdAsync(int contractId)
        {
            return await _context.ContractExtensions
                .Include(e => e.Requester)
                .FirstOrDefaultAsync(e => e.OriginalContractId == contractId && e.Status == "PENDING");
        }
    }
}