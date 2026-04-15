using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Shifts.GenerateSchedule;

public class GenerateScheduleHandler : IRequestHandler<GenerateScheduleCommand, GenerateScheduleResult>
{
    private readonly IStaffShiftRepository _repo;
    private readonly IStaffMembershipRepository _membershipRepo;

    public GenerateScheduleHandler(IStaffShiftRepository repo, IStaffMembershipRepository membershipRepo)
    {
        _repo = repo;
        _membershipRepo = membershipRepo;
    }

    public async Task<GenerateScheduleResult> Handle(GenerateScheduleCommand request, CancellationToken ct)
    {
        var membership = await _membershipRepo.GetCallerMembershipAsync(
            request.CallerId, request.WarehouseId, ct);
        if (membership == null || membership.RoleCode is not ("MANAGER" or "OPERATOR"))
            throw new UnauthorizedAccessException("Chỉ MANAGER / OPERATOR được tạo lịch tự động.");

        var summary = await _repo.GenerateScheduleAsync(request.WarehouseId, request.From, request.To, ct);
        return new GenerateScheduleResult
        {
            Message = summary.Message,
            Created = summary.Created,
            Skipped = summary.Skipped,
        };
    }
}
