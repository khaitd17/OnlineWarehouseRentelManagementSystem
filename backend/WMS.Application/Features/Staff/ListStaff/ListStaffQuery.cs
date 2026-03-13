using MediatR;

namespace WMS.Application.Features.Staff.ListStaff;

public class ListStaffQuery : IRequest<StaffMembershipPagedResult>
{
    public int WarehouseId { get; set; }
    public string? Search { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
