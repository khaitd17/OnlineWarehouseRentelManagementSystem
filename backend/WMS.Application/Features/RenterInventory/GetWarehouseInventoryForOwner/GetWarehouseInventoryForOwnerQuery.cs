using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RenterInventory.GetWarehouseInventoryForOwner;

// ── Query ──────────────────────────────────────────────────────────────
public class GetWarehouseInventoryForOwnerQuery : IRequest<GetWarehouseInventoryResult>
{
    public int RequestingUserId { get; init; }
    public int WarehouseId      { get; init; }
}

// ── Result ─────────────────────────────────────────────────────────────
public class GetWarehouseInventoryResult
{
    public bool IsAuthorized { get; init; }
    public List<WarehouseInventoryRowDto> Rows { get; init; } = new();
}

// Alias để không cần import WMS.Domain.Interfaces trực tiếp từ controller
public class WarehouseInventoryRowDto
{
    public int      InventoryId   { get; init; }
    public int      AssetId       { get; init; }
    public string   AssetName     { get; init; } = "";
    public string   Unit          { get; init; } = "";
    public decimal? WeightPerUnit { get; init; }
    public decimal? VolumePerUnit { get; init; }
    public decimal? LengthPerUnit { get; init; }
    public decimal? WidthPerUnit  { get; init; }
    public string?  Description   { get; init; }
    public int      RenterId      { get; init; }
    public string   RenterName    { get; init; } = "";
    public string?  RenterEmail   { get; init; }
    public int      Quantity      { get; init; }
    public DateTime UpdatedAt     { get; init; }
}
