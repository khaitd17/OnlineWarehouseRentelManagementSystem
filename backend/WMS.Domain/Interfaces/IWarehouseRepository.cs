using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface IWarehouseRepository
{
    Task<int> CreateAsync(Warehouse warehouse, CancellationToken cancellationToken);

    Task<int?> FindWarehouseOwnerById(int warehouseId, CancellationToken cancellationToken);

    Task<Warehouse?> GetByIdAsync(int warehouseId, CancellationToken cancellationToken);
    Task<List<Warehouse>> GetByOwnerIdAsync(int ownerId, CancellationToken cancellationToken);
    Task<List<Warehouse>> GetApprovedWarehousesAsync(int limit, CancellationToken cancellationToken);
    Task UpdateAsync(Warehouse warehouse, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int warehouseId, CancellationToken cancellationToken);
    Task DeleteAsync(int warehouseId, CancellationToken cancellationToken);
    Task RestoreAsync(int warehouseId, CancellationToken cancellationToken);
    Task<List<VWarehouseOccupancy>> GetOccupancyStatsByOwnerAsync(int ownerId, CancellationToken cancellationToken);

    /// <summary>
    /// Tính tổng diện tích đang được thuê cho một kho (từ hợp đồng ACTIVE, PENDING_PAYMENT, PENDING_TERMINATION, PENDING_CLOSE).
    /// </summary>
    Task<double> GetRentedAreaAsync(int warehouseId, CancellationToken cancellationToken);

    /// <summary>
    /// Tính tổng diện tích đang được thuê cho TẤT CẢ kho (batch). Trả về Dictionary warehouseId -> rentedArea.
    /// </summary>
    Task<Dictionary<int, double>> GetAllRentedAreasAsync(CancellationToken cancellationToken);
}