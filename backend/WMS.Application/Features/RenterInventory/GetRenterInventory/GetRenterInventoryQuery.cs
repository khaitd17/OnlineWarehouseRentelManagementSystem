using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RenterInventory.GetRenterInventory;

// ── Query ──────────────────────────────────────────────────────────────
public class GetRenterInventoryQuery : IRequest<List<RenterInventoryRowDto>>
{
    public int  RenterId    { get; init; }
    public int? WarehouseId { get; init; }
}

// ── DTO (mirror of domain DTO để Application layer không phụ thuộc Controller) ──
public class RenterInventoryRowDto
{
    public int      InventoryId   { get; init; }
    public int      AssetId       { get; init; }
    public string   AssetName     { get; init; } = "";
    public string   Unit          { get; init; } = "";
    public decimal? WeightPerUnit { get; init; }
    public string?  Description   { get; init; }
    public int      WarehouseId   { get; init; }
    public string   WarehouseName { get; init; } = "";
    public int      Quantity      { get; init; }
    public DateTime UpdatedAt     { get; init; }
}
