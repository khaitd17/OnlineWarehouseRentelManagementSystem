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
        int page, int pageSize, bool excludePending, CancellationToken cancellationToken);


    Task<List<InventoryRequest>> GetConfirmedByWarehouseAsync(int warehouseId, string? type, CancellationToken cancellationToken);

    /// <summary>
    /// Lấy các request có status ASSIGNED được giao cho staffId trong warehouseId.
    /// </summary>
    Task<List<InventoryRequest>> GetAssignedToStaffByWarehouseAsync(int staffId, int warehouseId, string? type, CancellationToken cancellationToken);

    Task<InventoryRequest?> GetByIdAsync(int id, CancellationToken cancellationToken);

    /// <summary>Tra cứu yêu cầu bằng RequestCode (dùng cho QR verify công khai).</summary>
    Task<InventoryRequest?> GetByRequestCodeAsync(string requestCode, CancellationToken cancellationToken);

    // Write
    Task<InventoryRequest> CreateAsync(InventoryRequest request, CancellationToken cancellationToken);
    Task UpdateAsync(InventoryRequest request, CancellationToken cancellationToken);
    Task DeleteAsync(int id, CancellationToken cancellationToken);

    /// <summary>
    /// Lấy danh sách phiếu nhập đang chờ duyệt sức chứa tại 1 kho.
    /// </summary>
    Task<List<object>> GetPendingCapacityNotesAsync(int warehouseId, CancellationToken cancellationToken);
}

