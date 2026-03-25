using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Repositories
{
    public class WarehouseReturnRepository : IWarehouseReturnRepository
    {
        private readonly ApplicationDbContext _context;

        public WarehouseReturnRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<WarehouseReturn?> GetByIdAsync(int returnId)
        {
            return await _context.WarehouseReturns
                .Include(r => r.Images)
                .Include(r => r.Contract)
                .FirstOrDefaultAsync(r => r.ReturnId == returnId);
        }

        public async Task<WarehouseReturn?> GetByContractIdAsync(int contractId)
        {
            return await _context.WarehouseReturns
                .Include(r => r.Images)
                .FirstOrDefaultAsync(r => r.ContractId == contractId);
        }

        public async Task<List<WarehouseReturn>> GetListAsync()
        {
            return await _context.WarehouseReturns
                .Include(r => r.Contract)
                .Include(r => r.Images)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<int> AddAsync(WarehouseReturn warehouseReturn)
        {
            _context.WarehouseReturns.Add(warehouseReturn);
            await _context.SaveChangesAsync();
            return warehouseReturn.ReturnId;
        }

        public async Task UpdateAsync(WarehouseReturn warehouseReturn)
        {
            _context.WarehouseReturns.Update(warehouseReturn);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int returnId)
        {
            var entity = await _context.WarehouseReturns.FindAsync(returnId);
            if (entity != null)
            {
                _context.WarehouseReturns.Remove(entity);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<List<WarehouseReturn>> GetByStatusAsync(string status)
        {
            return await _context.WarehouseReturns
                .Include(r => r.Contract)
                .Where(r => r.Status == status)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<bool> ExistsByContractIdAsync(int contractId)
        {
            return await _context.WarehouseReturns
                .AnyAsync(r => r.ContractId == contractId);
        }

        public async Task<List<WarehouseReturn>> GetPendingByWarehouseIdsAsync(List<int> warehouseIds)
        {
            // Get returns that are pending approval for contracts belonging to these warehouses
            return await _context.WarehouseReturns
                .Include(r => r.Contract)
                .Where(r => r.Contract != null
                    && warehouseIds.Contains(r.Contract.WarehouseId)
                    && (r.Status == WarehouseReturnStatus.PendingApproval
                        || r.Status == WarehouseReturnStatus.Initiated
                        || r.Status == WarehouseReturnStatus.Inspected))
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }
    }
}