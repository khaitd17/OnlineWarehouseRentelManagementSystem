using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.InventoryRequests.GetWarehouseAssets;

public record GetWarehouseAssetsQuery : IRequest<List<WarehouseInventoryRowDto>>
{
    public int WarehouseId { get; init; }
}

public class GetWarehouseAssetsHandler
    : IRequestHandler<GetWarehouseAssetsQuery, List<WarehouseInventoryRowDto>>
{
    private readonly IRenterAssetRepository _repo;
    public GetWarehouseAssetsHandler(IRenterAssetRepository repo) => _repo = repo;

    public Task<List<WarehouseInventoryRowDto>> Handle(
        GetWarehouseAssetsQuery q, CancellationToken ct)
        => _repo.GetInventoryByWarehouseAsync(q.WarehouseId, ct);
}
