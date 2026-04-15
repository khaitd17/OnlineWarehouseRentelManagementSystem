using MediatR;

namespace WMS.Application.Features.Attendance.CheckIn;

public record CheckInCommand : IRequest<CheckInResult>
{
    public int    CallerId     { get; init; }
    public int    StaffShiftId { get; init; }
    public string PhotoUrl     { get; init; } = "";
}

public record CheckInResult
{
    public DateTime CheckInAt    { get; init; }
    public string   CheckInPhoto { get; init; } = "";
}
