using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Repositories;

public class RatingRepository : IRatingRepository
{
    private readonly ApplicationDbContext _context;

    public RatingRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<int> CreateAsync(Rating rating, CancellationToken cancellationToken)
    {
        _context.Ratings.Add(rating);
        await _context.SaveChangesAsync(cancellationToken);
        return rating.RatingId;
    }

    public async Task<Rating?> GetByIdAsync(int ratingId, CancellationToken cancellationToken)
    {
        return await _context.Ratings
            .Include(r => r.Renter)
            .Include(r => r.Warehouse)
            .Include(r => r.Contract)
            .FirstOrDefaultAsync(r => r.RatingId == ratingId, cancellationToken);
    }

    public async Task<List<Rating>> GetByWarehouseIdAsync(int warehouseId, CancellationToken cancellationToken)
    {
        return await _context.Ratings
            .Include(r => r.Renter)
            .Include(r => r.Contract)
            .Where(r => r.WarehouseId == warehouseId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Rating>> GetByRenterIdAsync(int renterId, CancellationToken cancellationToken)
    {
        return await _context.Ratings
            .Include(r => r.Warehouse)
            .Include(r => r.Contract)
            .Where(r => r.RenterId == renterId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Rating?> GetByContractIdAsync(int contractId, CancellationToken cancellationToken)
    {
        return await _context.Ratings
            .FirstOrDefaultAsync(r => r.ContractId == contractId, cancellationToken);
    }

    public async Task UpdateAsync(Rating rating, CancellationToken cancellationToken)
    {
        _context.Ratings.Update(rating);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(int ratingId, CancellationToken cancellationToken)
    {
        var rating = await _context.Ratings.FindAsync(new object[] { ratingId }, cancellationToken);
        if (rating != null)
        {
            _context.Ratings.Remove(rating);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<List<Rating>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _context.Ratings
            .Include(r => r.Renter)
            .Include(r => r.Warehouse)
            .Include(r => r.Contract)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<(double avgStar, int count)> GetWarehouseStatsAsync(int warehouseId, CancellationToken cancellationToken)
    {
        var ratings = await _context.Ratings
            .Where(r => r.WarehouseId == warehouseId && (r.IsHidden == null || r.IsHidden == false))
            .ToListAsync(cancellationToken);

        if (!ratings.Any())
            return (0, 0);

        return (ratings.Average(r => r.Star), ratings.Count);
    }
}
