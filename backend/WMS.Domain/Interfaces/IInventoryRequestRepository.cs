using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface IInventoryRequestRepository
{
    // Read
    Task<(List<InventoryRequest> Items, int TotalCount)> GetByOwnerIdAsync(
        int ownerId, string type, string? status, int? warehouseId,
        int page, int pageSize, CancellationToken cancellationToken);

    Task<(List<InventoryRequest> Items, int TotalCount)> GetForRenterAsync(
        int renterId, string type, string? status,
        int page, int pageSize, CancellationToken cancellationToken);

    Task<(List<InventoryRequest> Items, int TotalCount)> GetForStaffAsync(
        string type, string? status, int? warehouseId,
        int page, int pageSize, CancellationToken cancellationToken);


    Task<List<InventoryRequest>> GetConfirmedByWarehouseAsync(int warehouseId, string? type, CancellationToken cancellationToken);

    Task<InventoryRequest?> GetByIdAsync(int id, CancellationToken cancellationToken);

    // Write
    Task<InventoryRequest> CreateAsync(InventoryRequest request, CancellationToken cancellationToken);
    Task UpdateAsync(InventoryRequest request, CancellationToken cancellationToken);
    Task DeleteAsync(int id, CancellationToken cancellationToken);
}

