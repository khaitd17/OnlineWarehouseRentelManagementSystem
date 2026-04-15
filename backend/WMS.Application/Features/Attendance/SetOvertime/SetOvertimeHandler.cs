using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Attendance.SetOvertime;

public class SetOvertimeHandler : IRequestHandler<SetOvertimeCommand>
{
    private readonly IStaffShiftRepository _shiftRepo;
    private readonly IStaffMembershipRepository _membershipRepo;

    public SetOvertimeHandler(IStaffShiftRepository shiftRepo, IStaffMembershipRepository membershipRepo)
    {
        _shiftRepo      = shiftRepo;
        _membershipRepo = membershipRepo;
    }

    public async Task Handle(SetOvertimeCommand request, CancellationToken ct)
    {
        var shift = await _shiftRepo.GetByIdAsync(request.StaffShiftId, ct)
            ?? throw new KeyNotFoundException("Khong tim thay ca lam viec.");

        // Kiem tra caller co phai OPERATOR / MANAGER cua kho khong (HasRoleAsync de tranh bug priority)
        bool isOperator = await _membershipRepo.HasRoleAsync(request.CallerId, shift.Membership.WarehouseId, "OPERATOR", ct);
        bool isManager  = await _membershipRepo.HasRoleAsync(request.CallerId, shift.Membership.WarehouseId, "MANAGER",  ct);

        if (!isOperator && !isManager)
            throw new UnauthorizedAccessException("Chỉ OPERATOR / MANAGER được cập nhật tăng ca.");

        if (request.Hours < 0 || request.Hours > 12)
            throw new InvalidOperationException("So gio tang ca khong hop le (0 - 12).");

        await _shiftRepo.SetOvertimeAsync(request.StaffShiftId, request.Hours, ct);
    }
}
