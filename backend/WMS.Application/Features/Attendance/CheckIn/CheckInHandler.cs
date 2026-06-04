using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Attendance.CheckIn;

public class CheckInHandler : IRequestHandler<CheckInCommand, CheckInResult>
{
    private readonly IStaffShiftRepository _shiftRepo;

    // Cho phep check-in som toi da 2 tieng truoc gio vao ca
    private const int EarlyCheckinAllowedHours = 2;

    // Timezone Viet Nam (UTC+7)
    private static readonly TimeZoneInfo VnTz =
        TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");

    private static DateTime VnNow => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, VnTz);

    public CheckInHandler(IStaffShiftRepository shiftRepo)
    {
        _shiftRepo = shiftRepo;
    }

    public async Task<CheckInResult> Handle(CheckInCommand request, CancellationToken ct)
    {
        var shift = await _shiftRepo.GetByIdAsync(request.StaffShiftId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy ca làm việc.");

        // Kiem tra shift thuoc ve nguoi dang goi
        if (shift.Membership.UserId != request.CallerId)
            throw new UnauthorizedAccessException("Không có quyền check-in ca này.");

        // Khong cho check-in neu nghi ca
        if (shift.ShiftType is "NC" or "OFF")
            throw new InvalidOperationException("Ca hôm nay là ngày nghỉ, không thể điểm danh.");

        // Kiem tra cua so cho phep check-in: TimeIn1 - 2h
        if (!string.IsNullOrEmpty(shift.TimeIn1))
        {
            var inTime    = TimeOnly.Parse(shift.TimeIn1);
            var allowFrom = shift.ShiftDate.ToDateTime(inTime).AddHours(-EarlyCheckinAllowedHours);
            if (VnNow < allowFrom)
                throw new InvalidOperationException(
                    $"Chưa đến giờ điểm danh. Được phép check-in từ {allowFrom:HH:mm}.");
        }

        // Chi duoc check-in 1 lan
        if (shift.CheckInAt.HasValue)
            throw new InvalidOperationException(
                $"Bạn đã điểm danh vào ca lúc {shift.CheckInAt.Value:HH:mm}. Không thể check-in lại.");

        var now = VnNow;
        await _shiftRepo.RecordCheckInAsync(shift.Id, now, request.PhotoUrl, ct);

        return new CheckInResult { CheckInAt = now, CheckInPhoto = request.PhotoUrl };
    }
}
