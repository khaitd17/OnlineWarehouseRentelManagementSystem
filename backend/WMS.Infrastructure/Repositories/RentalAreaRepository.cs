using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Repositories;

public class RentalAreaRepository : IRentalAreaRepository
{
    private readonly ApplicationDbContext _context;

    public RentalAreaRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<int> CreateAsync(RentalArea rentalArea, CancellationToken cancellationToken)
    {
        await _context.RentalAreas.AddAsync(rentalArea, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return rentalArea.Id;
    }

    public async Task<RentalArea?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.RentalAreas
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public async Task<List<RentalArea>> GetByWarehouseIdAsync(int warehouseId, CancellationToken cancellationToken)
    {
        return await _context.RentalAreas
            .Where(r => r.WarehouseId == warehouseId)
            .ToListAsync(cancellationToken);
    }

    public async Task UpdateAsync(RentalArea rentalArea, CancellationToken cancellationToken)
    {
        _context.RentalAreas.Update(rentalArea);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(RentalArea rentalArea, CancellationToken cancellationToken)
    {
        _context.RentalAreas.Remove(rentalArea);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<double> GetTotalAllocatedAreaAsync(int warehouseId, CancellationToken cancellationToken)
    {
        return await _context.RentalAreas
            .Where(r => r.WarehouseId == warehouseId)
            .SumAsync(r => r.Size, cancellationToken);
    }
}
