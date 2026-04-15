using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Shifts.SaveShifts;

public class SaveShiftsHandler : IRequestHandler<SaveShiftsCommand>
{
    private readonly IStaffShiftRepository _repo;
    private readonly IStaffMembershipRepository _membershipRepo;

    public SaveShiftsHandler(IStaffShiftRepository repo, IStaffMembershipRepository membershipRepo)
    {
        _repo = repo;
        _membershipRepo = membershipRepo;
    }

    public async Task Handle(SaveShiftsCommand request, CancellationToken ct)
    {
        if (request.WarehouseId.HasValue)
        {
            bool isOperator = await _membershipRepo.HasRoleAsync(request.CallerId, request.WarehouseId.Value, "OPERATOR", ct);
            bool isManager  = await _membershipRepo.HasRoleAsync(request.CallerId, request.WarehouseId.Value, "MANAGER",  ct);
            if (!isOperator && !isManager)
                throw new UnauthorizedAccessException("Chỉ OPERATOR / MANAGER được lưu lịch ca.");
        }

        // Khong cho tao / sua ca cho ngay da qua
        var today   = DateOnly.FromDateTime(DateTime.Today);
        var invalid = request.Shifts
            .Where(s => DateOnly.TryParseExact(s.ShiftDate, "yyyy-MM-dd", null,
                            System.Globalization.DateTimeStyles.None, out var d) && d < today)
            .Select(s => s.ShiftDate)
            .ToList();

        if (invalid.Count > 0)
            throw new InvalidOperationException(
                $"Khong the tao/sua ca cho ngay da qua: {string.Join(", ", invalid)}");

        await _repo.SaveShiftsAsync(request.Shifts, ct);
    }
}
