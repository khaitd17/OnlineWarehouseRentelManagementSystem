using MediatR;

namespace WMS.Application.Features.Attendance.CheckOut;

public record CheckOutCommand : IRequest<CheckOutResult>
{
    public int    CallerId     { get; init; }
    public int    StaffShiftId { get; init; }
    public string PhotoUrl     { get; init; } = "";
}

public record CheckOutResult
{
    public DateTime CheckOutAt    { get; init; }
    public string   CheckOutPhoto { get; init; } = "";
    public bool     IsEarlyLeave  { get; init; }
    public int      EarlyMinutes  { get; init; }
}
