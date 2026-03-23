using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Staff.ListStaff;

public class ListStaffHandler : IRequestHandler<ListStaffQuery, StaffMembershipPagedResult>
{
    private readonly IStaffMembershipRepository _repo;

    public ListStaffHandler(IStaffMembershipRepository repo)
    {
        _repo = repo;
    }

    public async Task<StaffMembershipPagedResult> Handle(
        ListStaffQuery request,
        CancellationToken cancellationToken)
    {
        if (request.WarehouseId <= 0)
            throw new ArgumentException("warehouseId là bắt buộc.");

        return await _repo.GetByWarehouseAsync(
            request.WarehouseId,
            request.Search,
            request.Page,
            request.PageSize,
            callerId: request.CallerId,
            cancellationToken);
    }
}
