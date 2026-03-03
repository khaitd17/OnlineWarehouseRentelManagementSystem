using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface IRentalRequestRepository
{
    Task<RentalRequest?> GetByIdAsync(int id);
    Task<IEnumerable<RentalRequest>> GetAllAsync();
    Task<IEnumerable<RentalRequest>> GetByRenterIdAsync(int renterId);
    Task<IEnumerable<RentalRequest>> GetByWarehouseIdAsync(int warehouseId);
    Task<IEnumerable<RentalRequest>> GetByStatusAsync(string status);
    Task<int> AddAsync(RentalRequest rentalRequest);
    Task UpdateAsync(RentalRequest rentalRequest);
    Task<bool> DeleteAsync(int id);
}
