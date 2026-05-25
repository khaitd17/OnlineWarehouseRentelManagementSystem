using MediatR;

namespace WMS.Application.Features.Staff.SetStaffShift;

public class SetStaffShiftCommand : IRequest<Unit>
{
    public int CallerId { get; set; }
    public int MembershipId { get; set; }
    public int? WarehouseShiftId { get; set; }
}
