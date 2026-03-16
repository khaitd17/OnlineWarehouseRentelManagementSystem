using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface IRentalRequestRepository
{
    Task<RentalRequest?> GetByIdAsync(int requestId);
    Task<IEnumerable<RentalRequest>> GetByRenterIdAsync(int renterId);
    Task<IEnumerable<RentalRequest>> GetByWarehouseIdAsync(int warehouseId);
    Task<IEnumerable<RentalRequest>> GetPendingByWarehouseOwnerIdAsync(int ownerId);
    Task<IEnumerable<RentalRequest>> GetByStatusAsync(string status);
    Task<IEnumerable<RentalRequest>> GetByOwnerIdAsync(int ownerId);
    Task<int> AddAsync(RentalRequest request);
    Task UpdateAsync(RentalRequest request);
    Task<bool> HasPendingRequestAsync(int renterId, int warehouseId);
}
