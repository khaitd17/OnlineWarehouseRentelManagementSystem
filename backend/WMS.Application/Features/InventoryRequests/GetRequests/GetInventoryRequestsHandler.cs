using MediatR;
using WMS.Application.Features.InventoryRequests.Shared;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.InventoryRequests.GetRequests;

// ─── Query ───────────────────────────────────────────────────────────────────
public record GetInventoryRequestsQuery : IRequest<PagedResult<InventoryRequestDto>>
{
    // ViewAs = RoleCode từ membership: OWNER | OPERATOR | MANAGER | STAFF | RENTER
    public string ViewAs { get; init; } = "RENTER";
    public int UserId { get; init; }
    public string Type { get; init; } = "INBOUND";
    public string? Status { get; init; }
    public int? WarehouseId { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 10;
}

// ─── Handler ─────────────────────────────────────────────────────────────────
public class GetInventoryRequestsHandler
    : IRequestHandler<GetInventoryRequestsQuery, PagedResult<InventoryRequestDto>>
{
    private readonly IInventoryRequestRepository _repo;

    public GetInventoryRequestsHandler(IInventoryRequestRepository repo) => _repo = repo;

    public async Task<PagedResult<InventoryRequestDto>> Handle(
        GetInventoryRequestsQuery q, CancellationToken cancellationToken)
    {
        var (items, total) = q.ViewAs.ToUpper() switch
        {
            "OWNER"    => await _repo.GetByOwnerIdAsync(             // kho mình sở hữu
                q.UserId, q.Type.ToUpper(), q.Status?.ToUpper(), q.WarehouseId,
                q.Page, q.PageSize, cancellationToken),

            "OPERATOR" => await _repo.GetForStaffAsync(              // vận hành toàn kho
                q.Type.ToUpper(), q.Status?.ToUpper(), q.WarehouseId,
                q.Page, q.PageSize, false, cancellationToken),

            "MANAGER"  => await _repo.GetForStaffAsync(              // duyệt / từ chối
                q.Type.ToUpper(), q.Status?.ToUpper(), q.WarehouseId,
                q.Page, q.PageSize, false, cancellationToken),

            "STAFF"    => await _repo.GetForStaffAsync(              // thực hiện
                q.Type.ToUpper(), q.Status?.ToUpper(), q.WarehouseId,
                q.Page, q.PageSize, true, cancellationToken),

            "RENTER"   => await _repo.GetForRenterAsync(             // của chính mình
                q.UserId, q.Type.ToUpper(), q.Status?.ToUpper(),
                q.Page, q.PageSize, cancellationToken),

            _          => await _repo.GetForRenterAsync(             // fallback an toàn
                q.UserId, q.Type.ToUpper(), q.Status?.ToUpper(),
                q.Page, q.PageSize, cancellationToken),
        };

        return new PagedResult<InventoryRequestDto>
        {
            Items      = items.Select(InventoryRequestMapper.ToDto).ToList(),
            TotalCount = total,
            Page       = q.Page,
            PageSize   = q.PageSize,
            TotalPages = (int)Math.Ceiling((double)total / q.PageSize),
        };
    }
}
