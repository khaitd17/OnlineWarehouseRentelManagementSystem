using WMS.Domain.Entities;

namespace WMS.Domain.Interfaces;

public interface IRenterAssetRepository
{
    Task<List<RenterInventoryRowDto>> GetInventoryByRenterAsync(
        int renterId,
        int? warehouseId,
        CancellationToken cancellationToken);

    Task<List<WarehouseInventoryRowDto>> GetInventoryByWarehouseAsync(
        int warehouseId,
        CancellationToken cancellationToken);

    Task<RenterAsset?> GetByIdAsync(int assetId, CancellationToken cancellationToken);

    Task AdjustRenterInventoryAsync(int assetId, int warehouseId, int delta, CancellationToken cancellationToken);
}

public record RenterInventoryRowDto
{
    public int InventoryId    { get; init; }
    public int AssetId        { get; init; }
    public string AssetName   { get; init; } = "";
    public string Unit        { get; init; } = "";
    public decimal? WeightPerUnit { get; init; }
    public string? Description { get; init; }
    public int WarehouseId    { get; init; }
    public string WarehouseName { get; init; } = "";
    public int Quantity       { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public record WarehouseInventoryRowDto
{
    public int InventoryId    { get; init; }
    public int AssetId        { get; init; }
    public string AssetName   { get; init; } = "";
    public string Unit        { get; init; } = "";
    public decimal? WeightPerUnit { get; init; }
    public string? Description { get; init; }
    public int RenterId       { get; init; }
    public string RenterName  { get; init; } = "";
    public string? RenterEmail { get; init; }
    public int Quantity       { get; init; }
    public DateTime UpdatedAt { get; init; }
}
