using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface IRenterAssetRepository
{
    Task<List<RenterAsset>> GetByRenterAsync(int renterId, CancellationToken ct);
    Task<RenterAsset?> GetByIdAsync(int assetId, CancellationToken ct);
    Task<RenterAsset> CreateAsync(RenterAsset asset, CancellationToken ct);

    /// <summary>
    /// Lấy tồn kho của renter tại 1 warehouse cụ thể (API cũ).
    /// Join renter_inventory + renter_assets, chỉ trả về asset thuộc renterId.
    /// </summary>
    Task<List<RenterInventory>> GetInventoryByWarehouseAsync(int renterId, int warehouseId, CancellationToken ct);

    /// <summary>
    /// Upsert tồn kho: tạo mới hoặc cập nhật quantity trong renter_inventory.
    /// delta > 0 = INBOUND, delta < 0 = OUTBOUND.
    /// </summary>
    Task AdjustRenterInventoryAsync(int assetId, int warehouseId, int delta, CancellationToken ct);

    /// <summary>
    /// Lấy toàn bộ tồn kho của 1 renter (tuỳ chọn lọc theo warehouseId).
    /// </summary>
    Task<List<RenterInventoryRowDto>> GetInventoryByRenterAsync(
        int renterId,
        int? warehouseId,
        CancellationToken cancellationToken);

    /// <summary>
    /// Lấy toàn bộ tồn kho trong 1 kho (tất cả renter).
    /// </summary>
    Task<List<WarehouseInventoryRowDto>> GetInventoryByWarehouseAsync(
        int warehouseId,
        CancellationToken cancellationToken);

    /// <summary>
    /// Trả về warehouse role cao nhất của user trong 1 kho (OWNER > OPERATOR > MANAGER > STAFF > RENTER).
    /// Trả về "" nếu user không có membership.
    /// </summary>
    Task<string> GetHighestWarehouseRoleAsync(int userId, int warehouseId, CancellationToken ct);
}

public record RenterInventoryRowDto
{
    public int InventoryId      { get; init; }
    public int AssetId          { get; init; }
    public string AssetName     { get; init; } = "";
    public string Unit          { get; init; } = "";
    public decimal? WeightPerUnit { get; init; }
    public string? Description  { get; init; }
    public int WarehouseId      { get; init; }
    public string WarehouseName { get; init; } = "";
    public int Quantity         { get; init; }
    public DateTime UpdatedAt   { get; init; }
}

public record WarehouseInventoryRowDto
{
    public int InventoryId      { get; init; }
    public int AssetId          { get; init; }
    public string AssetName     { get; init; } = "";
    public string Unit          { get; init; } = "";
    public decimal? WeightPerUnit { get; init; }
    public string? Description  { get; init; }
    public int RenterId         { get; init; }
    public string RenterName    { get; init; } = "";
    public string? RenterEmail  { get; init; }
    public int Quantity         { get; init; }
    public DateTime UpdatedAt   { get; init; }
}
