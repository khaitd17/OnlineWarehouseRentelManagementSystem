using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Repositories;

public class RentalRequestRepository : IRentalRequestRepository
{
    private readonly ApplicationDbContext _context;

    public RentalRequestRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<RentalRequest?> GetByIdAsync(int id)
    {
        return await _context.RentalRequests
            .Include(r => r.Warehouse)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<IEnumerable<RentalRequest>> GetAllAsync()
    {
        return await _context.RentalRequests
            .Include(r => r.Warehouse)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<RentalRequest>> GetByRenterIdAsync(int renterId)
    {
        return await _context.RentalRequests
            .Include(r => r.Warehouse)
            .Where(r => r.RenterId == renterId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<RentalRequest>> GetByWarehouseIdAsync(int warehouseId)
    {
        return await _context.RentalRequests
            .Include(r => r.Warehouse)
            .Where(r => r.WarehouseId == warehouseId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<RentalRequest>> GetByStatusAsync(string status)
    {
        return await _context.RentalRequests
            .Include(r => r.Warehouse)
            .Where(r => r.Status == status)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<int> AddAsync(RentalRequest rentalRequest)
    {
        _context.RentalRequests.Add(rentalRequest);
        await _context.SaveChangesAsync();
        return rentalRequest.Id;
    }

    public async Task UpdateAsync(RentalRequest rentalRequest)
    {
        _context.RentalRequests.Update(rentalRequest);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var rentalRequest = await _context.RentalRequests.FindAsync(id);
        if (rentalRequest == null)
            return false;

        _context.RentalRequests.Remove(rentalRequest);
        await _context.SaveChangesAsync();
        return true;
    }
}
