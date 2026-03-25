using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RenterInventory.GetRenterInventory;

public class GetRenterInventoryHandler
    : IRequestHandler<GetRenterInventoryQuery, List<RenterInventoryRowDto>>
{
    private readonly IRenterAssetRepository _repo;

    public GetRenterInventoryHandler(IRenterAssetRepository repo)
        => _repo = repo;

    public async Task<List<RenterInventoryRowDto>> Handle(
        GetRenterInventoryQuery request,
        CancellationToken cancellationToken)
    {
        var domainRows = await _repo.GetInventoryByRenterAsync(
            request.RenterId,
            request.WarehouseId,
            cancellationToken);

        return domainRows.Select(r => new RenterInventoryRowDto
        {
            InventoryId   = r.InventoryId,
            AssetId       = r.AssetId,
            AssetName     = r.AssetName,
            Unit          = r.Unit,
            WeightPerUnit = r.WeightPerUnit,
            Description   = r.Description,
            WarehouseId   = r.WarehouseId,
            WarehouseName = r.WarehouseName,
            Quantity      = r.Quantity,
            UpdatedAt     = r.UpdatedAt,
        }).ToList();
    }
}
