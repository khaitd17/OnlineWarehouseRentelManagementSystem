using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.InventoryRequests.GetRenterAssets;

public record GetRenterAssetsQuery : IRequest<List<RenterInventoryRowDto>>
{
    public int RenterId { get; init; }
    public int? WarehouseId { get; init; }
}

public class GetRenterAssetsHandler
    : IRequestHandler<GetRenterAssetsQuery, List<RenterInventoryRowDto>>
{
    private readonly IRenterAssetRepository _repo;
    public GetRenterAssetsHandler(IRenterAssetRepository repo) => _repo = repo;

    public Task<List<RenterInventoryRowDto>> Handle(
        GetRenterAssetsQuery q, CancellationToken ct)
        => _repo.GetInventoryByRenterAsync(q.RenterId, q.WarehouseId, ct);
}
