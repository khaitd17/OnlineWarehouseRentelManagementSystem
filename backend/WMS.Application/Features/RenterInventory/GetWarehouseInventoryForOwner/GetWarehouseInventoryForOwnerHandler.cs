using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RenterInventory.GetWarehouseInventoryForOwner;

public class GetWarehouseInventoryForOwnerHandler
    : IRequestHandler<GetWarehouseInventoryForOwnerQuery, GetWarehouseInventoryResult>
{
    private static readonly string[] AllowedRoles = { "OWNER", "OPERATOR", "MANAGER" };

    private readonly IRenterAssetRepository _repo;

    public GetWarehouseInventoryForOwnerHandler(IRenterAssetRepository repo)
        => _repo = repo;

    public async Task<GetWarehouseInventoryResult> Handle(
        GetWarehouseInventoryForOwnerQuery request,
        CancellationToken cancellationToken)
    {
        // 1. Kiểm tra quyền qua WarehouseMembership (không dùng JWT system role)
        var role = await _repo.GetHighestWarehouseRoleAsync(
            request.RequestingUserId, request.WarehouseId, cancellationToken);

        if (!AllowedRoles.Contains(role, StringComparer.OrdinalIgnoreCase))
            return new GetWarehouseInventoryResult { IsAuthorized = false };

        // 2. Lấy tồn kho
        var domainRows = await _repo.GetInventoryByWarehouseAsync(
            request.WarehouseId, cancellationToken);

        var rows = domainRows.Select(r => new WarehouseInventoryRowDto
        {
            InventoryId   = r.InventoryId,
            AssetId       = r.AssetId,
            AssetName     = r.AssetName,
            Unit          = r.Unit,
            WeightPerUnit = r.WeightPerUnit,
            Description   = r.Description,
            RenterId      = r.RenterId,
            RenterName    = r.RenterName,
            RenterEmail   = r.RenterEmail,
            Quantity      = r.Quantity,
            UpdatedAt     = r.UpdatedAt,
        }).ToList();

        return new GetWarehouseInventoryResult { IsAuthorized = true, Rows = rows };
    }
}
