using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface IRentalAreaRepository
{
    Task<int> CreateAsync(RentalArea rentalArea, CancellationToken cancellationToken);
    Task<RentalArea?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<List<RentalArea>> GetByWarehouseIdAsync(int warehouseId, CancellationToken cancellationToken);
    Task UpdateAsync(RentalArea rentalArea, CancellationToken cancellationToken);
    Task DeleteAsync(RentalArea rentalArea, CancellationToken cancellationToken);
    Task<double> GetTotalAllocatedAreaAsync(int warehouseId, CancellationToken cancellationToken);
}
