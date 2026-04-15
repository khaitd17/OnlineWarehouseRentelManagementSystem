using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Attendance.CheckIn;

public class CheckInHandler : IRequestHandler<CheckInCommand, CheckInResult>
{
    private readonly IStaffShiftRepository _shiftRepo;

    // Cho phep check-in som toi da 2 tieng truoc gio vao ca
    private const int EarlyCheckinAllowedHours = 2;

    public CheckInHandler(IStaffShiftRepository shiftRepo)
    {
        _shiftRepo = shiftRepo;
    }

    public async Task<CheckInResult> Handle(CheckInCommand request, CancellationToken ct)
    {
        var shift = await _shiftRepo.GetByIdAsync(request.StaffShiftId, ct)
            ?? throw new KeyNotFoundException("Khong tim thay ca lam viec.");

        // Kiem tra shift thuoc ve nguoi dang goi
        if (shift.Membership.UserId != request.CallerId)
            throw new UnauthorizedAccessException("Khong co quyen check-in ca nay.");

        // Khong cho check-in neu nghi ca
        if (shift.ShiftType is "NC" or "OFF")
            throw new InvalidOperationException("Ca hom nay la ngay nghi, khong the diem danh.");

        // Kiem tra cua so cho phep check-in: TimeIn1 - 2h
        if (!string.IsNullOrEmpty(shift.TimeIn1))
        {
            var inTime    = TimeOnly.Parse(shift.TimeIn1);
            var allowFrom = shift.ShiftDate.ToDateTime(inTime).AddHours(-EarlyCheckinAllowedHours);
            if (DateTime.Now < allowFrom)
                throw new InvalidOperationException(
                    $"Chua den gio diem danh. Duoc phep check-in tu {allowFrom:HH:mm}.");
        }

        // Chi duoc check-in 1 lan
        if (shift.CheckInAt.HasValue)
            throw new InvalidOperationException(
                $"Ban da diem danh vao ca luc {shift.CheckInAt.Value:HH:mm}. Khong the check-in lai.");

        var now = DateTime.Now;
        await _shiftRepo.RecordCheckInAsync(shift.Id, now, request.PhotoUrl, ct);

        return new CheckInResult { CheckInAt = now, CheckInPhoto = request.PhotoUrl };
    }
}
