using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.InventoryRequests.GetOwnerInventoryRequests;

public class GetOwnerInventoryRequestsHandler
    : IRequestHandler<GetOwnerInventoryRequestsQuery, OwnerInventoryRequestsResult>
{
    private readonly IInventoryRequestRepository _repo;

    public GetOwnerInventoryRequestsHandler(IInventoryRequestRepository repo)
    {
        _repo = repo;
    }

    public async Task<OwnerInventoryRequestsResult> Handle(
        GetOwnerInventoryRequestsQuery request,
        CancellationToken cancellationToken)
    {
        var (items, total) = await _repo.GetByOwnerIdAsync(
            request.OwnerId,
            request.Type,
            request.Status,
            request.WarehouseId,
            request.Page,
            request.PageSize,
            cancellationToken);

        var dtos = items.Select(r => new InventoryRequestDto
        {
            InvReqId   = r.InvReqId,
            Type       = r.Type,
            Status     = r.Status,
            RenterName  = r.Renter?.FullName ?? "",
            RenterEmail = r.Renter?.Email    ?? "",
            WarehouseId   = r.WarehouseId,
            WarehouseName = r.Warehouse?.Name ?? "",
            CreatedAt   = r.CreatedAt,
            ConfirmedAt = r.ConfirmedAt,
            Notes       = r.Notes,
            TotalItems  = r.InventoryItems.Count,
            Items       = r.InventoryItems.Select(i => new InventoryItemDto
            {
                ItemId      = i.ItemId,
                ItemName    = i.ItemName,
                Quantity    = i.Quantity,
                Unit        = i.Unit,
                Weight      = i.Weight,
                Description = i.Description,
            }).ToList(),

            // ── Timeline data ────────────────────────────────────
            ConfirmedByName    = r.ConfirmedByNavigation?.FullName,
            AssignedStaffName  = r.AssignedStaff?.FullName,
            AssignedStaffEmail = r.AssignedStaff?.Email,
            AssignedAt         = r.AssignedAt,
            AssignedNote       = r.AssignedNote,
            UpdatedAt          = r.UpdatedAt,
        }).ToList();

        return new OwnerInventoryRequestsResult
        {
            Items      = dtos,
            TotalCount = total,
            Page       = request.Page,
            PageSize   = request.PageSize,
            TotalPages = (int)Math.Ceiling((double)total / request.PageSize),
        };
    }
}
