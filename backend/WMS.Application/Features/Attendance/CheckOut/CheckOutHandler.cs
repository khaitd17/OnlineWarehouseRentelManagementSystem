using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Attendance.CheckOut;

public class CheckOutHandler : IRequestHandler<CheckOutCommand, CheckOutResult>
{
    private readonly IStaffShiftRepository _shiftRepo;

    // Buffer 2 tieng sau khi ket thuc ca (ke ca tang ca) de cho phep check-out muon
    private const int LateCheckOutBufferHours = 2;

    public CheckOutHandler(IStaffShiftRepository shiftRepo)
    {
        _shiftRepo = shiftRepo;
    }

    public async Task<CheckOutResult> Handle(CheckOutCommand request, CancellationToken ct)
    {
        var shift = await _shiftRepo.GetByIdAsync(request.StaffShiftId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy ca làm việc.");

        if (shift.Membership.UserId != request.CallerId)
            throw new UnauthorizedAccessException("Không có quyền check-out ca này.");

        if (shift.ShiftType is "NC" or "OFF")
            throw new InvalidOperationException("Ca hôm nay là ngày nghỉ, không thể điểm danh.");

        // Kiem tra deadline check-out: shiftEnd + overtime + 2h buffer
        var deadline = ComputeCheckOutDeadline(shift);
        if (DateTime.Now > deadline)
            throw new InvalidOperationException(
                $"Da qua thoi gian check-out. Ca nay ket thuc luc {deadline:HH:mm dd/MM}.");

        // Re-checkout phai co gio moi lon hon gio cu
        if (shift.CheckOutAt.HasValue && DateTime.Now <= shift.CheckOutAt.Value)
            throw new InvalidOperationException(
                $"Gio check-out moi phai sau lan truoc ({shift.CheckOutAt.Value:HH:mm}).");

        var now = DateTime.Now;
        await _shiftRepo.RecordCheckOutAsync(shift.Id, now, request.PhotoUrl, ct);

        // Tinh ve som: so sanh voi gio tan ca goc (khong tinh OT, khong tinh buffer)
        bool isEarly  = false;
        int  earlyMins = 0;
        if (!string.IsNullOrEmpty(shift.TimeOut1))
        {
            var scheduledEnd = ComputeScheduledEnd(shift);
            if (now < scheduledEnd)
            {
                isEarly   = true;
                earlyMins = (int)(scheduledEnd - now).TotalMinutes;
            }
        }

        return new CheckOutResult
        {
            CheckOutAt    = now,
            CheckOutPhoto = request.PhotoUrl,
            IsEarlyLeave  = isEarly,
            EarlyMinutes  = earlyMins,
        };
    }

    // Deadline = gio tan ca + so gio tang ca + 2h buffer (xu ly ca dem)
    private static DateTime ComputeCheckOutDeadline(WMS.Domain.Entities.StaffShift shift)
    {
        if (string.IsNullOrEmpty(shift.TimeOut1))
            return shift.ShiftDate.ToDateTime(TimeOnly.MaxValue);

        var outTime  = TimeOnly.Parse(shift.TimeOut1);
        var baseDate = shift.ShiftDate.ToDateTime(outTime);

        if (!string.IsNullOrEmpty(shift.TimeIn1))
        {
            var inTime = TimeOnly.Parse(shift.TimeIn1);
            if (outTime < inTime) baseDate = baseDate.AddDays(1); // ca dem
        }

        return baseDate.AddHours((double)shift.OvertimeHours).AddHours(LateCheckOutBufferHours);
    }

    // Gio tan ca goc (khong tinh OT, khong tinh buffer) de tinh ve som
    private static DateTime ComputeScheduledEnd(WMS.Domain.Entities.StaffShift shift)
    {
        var outTime  = TimeOnly.Parse(shift.TimeOut1!);
        var baseDate = shift.ShiftDate.ToDateTime(outTime);

        if (!string.IsNullOrEmpty(shift.TimeIn1))
        {
            var inTime = TimeOnly.Parse(shift.TimeIn1);
            if (outTime < inTime) baseDate = baseDate.AddDays(1);
        }

        return baseDate;
    }
}
