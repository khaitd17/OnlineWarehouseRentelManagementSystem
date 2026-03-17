using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Staff.ListStaff;

public class ListStaffQuery : IRequest<StaffMembershipPagedResult>
{
    public int WarehouseId { get; set; }
    public string? Search { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    /// <summary>Nếu truyền vào thì tự động lọc theo scope của caller. null = lấy tất cả.</summary>
    public int? CallerId { get; set; }
}
