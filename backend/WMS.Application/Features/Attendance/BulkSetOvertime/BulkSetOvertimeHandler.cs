using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Attendance.BulkSetOvertime;

public class BulkSetOvertimeHandler : IRequestHandler<BulkSetOvertimeCommand>
{
    private readonly IStaffShiftRepository _shiftRepo;
    private readonly IStaffMembershipRepository _membershipRepo;

    public BulkSetOvertimeHandler(IStaffShiftRepository shiftRepo, IStaffMembershipRepository membershipRepo)
    {
        _shiftRepo      = shiftRepo;
        _membershipRepo = membershipRepo;
    }

    public async Task Handle(BulkSetOvertimeCommand request, CancellationToken ct)
    {
        // Dùng HasRoleAsync để tránh bug priority khi user có cả OWNER+OPERATOR
        bool isOperator = await _membershipRepo.HasRoleAsync(request.CallerId, request.WarehouseId, "OPERATOR", ct);
        bool isManager  = await _membershipRepo.HasRoleAsync(request.CallerId, request.WarehouseId, "MANAGER",  ct);

        if (!isOperator && !isManager)
            throw new UnauthorizedAccessException("Chi MANAGER / OPERATOR duoc tao tang ca.");

        if (request.Hours < 0 || request.Hours > 12)
            throw new InvalidOperationException("So gio tang ca khong hop le (0 - 12).");

        if (request.MembershipIds.Count == 0)
            throw new InvalidOperationException("Phai chon it nhat 1 nhan vien.");

        await _shiftRepo.BulkSetOvertimeAsync(
            request.WarehouseId, request.Date, request.MembershipIds, request.Hours, ct);
    }
}
