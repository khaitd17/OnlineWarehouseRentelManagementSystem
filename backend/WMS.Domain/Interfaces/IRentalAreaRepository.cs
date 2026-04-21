using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface IRentalAreaRepository
{
    Task<int> CreateAsync(RentalArea rentalArea, CancellationToken cancellationToken);
    Task<RentalArea?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<List<RentalArea>> GetByWarehouseIdAsync(int warehouseId, CancellationToken cancellationToken);
    /// <summary>Returns areas with IsOccupied/ActiveContractId populated via an active-contract check.</summary>
    Task<List<RentalArea>> GetWithOccupancyByWarehouseIdAsync(int warehouseId, CancellationToken cancellationToken);
    Task UpdateAsync(RentalArea rentalArea, CancellationToken cancellationToken);
    Task DeleteAsync(RentalArea rentalArea, CancellationToken cancellationToken);
    Task<double> GetTotalAllocatedAreaAsync(int warehouseId, CancellationToken cancellationToken);
    /// <summary>Returns the total allocated FLOOR area (sum of width × length) in m², matching TotalArea unit.</summary>
    Task<double> GetTotalAllocatedFloorAreaAsync(int warehouseId, CancellationToken cancellationToken);
    /// <summary>Returns true if the area is linked to any active/pending contract.</summary>
    Task<bool> IsAreaOccupiedAsync(int id, CancellationToken cancellationToken);
}
