using MediatR;

namespace WMS.Application.Features.Attendance.SetOvertime;

public record SetOvertimeCommand : IRequest
{
    public int     CallerId     { get; init; }
    public int     StaffShiftId { get; init; }
    public decimal Hours        { get; init; }
}
