using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface IRenterAssetRepository
{
    Task<List<RenterAsset>> GetByRenterAsync(int renterId, CancellationToken ct);
    Task<RenterAsset?> GetByIdAsync(int assetId, CancellationToken ct);
    Task<RenterAsset> CreateAsync(RenterAsset asset, CancellationToken ct);

    /// <summary>
    /// Lấy tồn kho của renter tại 1 warehouse cụ thể.
    /// Join renter_inventory + renter_assets, chỉ trả về asset thuộc renterId.
    /// </summary>
    Task<List<RenterInventory>> GetInventoryByWarehouseAsync(int renterId, int warehouseId, CancellationToken ct);

    /// <summary>
    /// Upsert tồn kho: tạo mới hoặc cập nhật quantity trong renter_inventory.
    /// delta > 0 = INBOUND, delta < 0 = OUTBOUND.
    /// </summary>
    Task AdjustRenterInventoryAsync(int assetId, int warehouseId, int delta, CancellationToken ct);
}
