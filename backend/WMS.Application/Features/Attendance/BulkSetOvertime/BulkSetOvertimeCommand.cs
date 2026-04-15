using MediatR;

namespace WMS.Application.Features.Attendance.BulkSetOvertime;

public record BulkSetOvertimeCommand : IRequest
{
    public int          CallerId      { get; init; }
    public int          WarehouseId   { get; init; }
    public DateOnly     Date          { get; init; }
    public List<int>    MembershipIds { get; init; } = new();
    public decimal      Hours         { get; init; }
}
