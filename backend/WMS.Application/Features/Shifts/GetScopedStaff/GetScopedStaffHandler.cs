using MediatR;
using WMS.Application.Features.Staff.ListStaff;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Shifts.GetScopedStaff;


public class GetScopedStaffQuery : IRequest<StaffMembershipPagedResult>
{
    public int CallerId { get; set; }
    public int WarehouseId { get; set; }
}

public class GetScopedStaffHandler : IRequestHandler<GetScopedStaffQuery, StaffMembershipPagedResult>
{
    private readonly ISender _mediator;

    public GetScopedStaffHandler(ISender mediator)
    {
        _mediator = mediator;
    }

    public Task<StaffMembershipPagedResult> Handle(GetScopedStaffQuery request, CancellationToken cancellationToken)
        => _mediator.Send(new ListStaffQuery
        {
            WarehouseId = request.WarehouseId,
            Page        = 1,
            PageSize    = 1000,
            CallerId    = request.CallerId,
        }, cancellationToken);
}
