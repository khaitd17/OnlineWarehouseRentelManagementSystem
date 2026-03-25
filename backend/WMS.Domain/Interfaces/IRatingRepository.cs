using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface IRatingRepository
{
    Task<int> CreateAsync(Rating rating, CancellationToken cancellationToken);
    Task<Rating?> GetByIdAsync(int ratingId, CancellationToken cancellationToken);
    Task<List<Rating>> GetByWarehouseIdAsync(int warehouseId, CancellationToken cancellationToken);
    Task<List<Rating>> GetByRenterIdAsync(int renterId, CancellationToken cancellationToken);
    Task<Rating?> GetByContractIdAsync(int contractId, CancellationToken cancellationToken);
    Task UpdateAsync(Rating rating, CancellationToken cancellationToken);
    Task DeleteAsync(int ratingId, CancellationToken cancellationToken);
    Task<List<Rating>> GetAllAsync(CancellationToken cancellationToken);
    Task<(double avgStar, int count)> GetWarehouseStatsAsync(int warehouseId, CancellationToken cancellationToken);
}
