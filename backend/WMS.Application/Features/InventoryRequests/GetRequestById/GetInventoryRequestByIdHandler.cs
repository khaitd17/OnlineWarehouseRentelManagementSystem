using MediatR;
using WMS.Application.Features.InventoryRequests.Shared;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.InventoryRequests.GetRequestById;

public record GetInventoryRequestByIdQuery : IRequest<InventoryRequestDto?>
{
    public int Id { get; init; }
}

public class GetInventoryRequestByIdHandler
    : IRequestHandler<GetInventoryRequestByIdQuery, InventoryRequestDto?>
{
    private readonly IInventoryRequestRepository _repo;
    public GetInventoryRequestByIdHandler(IInventoryRequestRepository repo) => _repo = repo;

    public async Task<InventoryRequestDto?> Handle(
        GetInventoryRequestByIdQuery q, CancellationToken cancellationToken)
    {
        var req = await _repo.GetByIdAsync(q.Id, cancellationToken);
        return req is null ? null : InventoryRequestMapper.ToDto(req);
    }
}
