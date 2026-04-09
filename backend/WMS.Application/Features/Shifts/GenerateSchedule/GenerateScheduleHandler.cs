using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Shifts.GenerateSchedule;

public class GenerateScheduleHandler : IRequestHandler<GenerateScheduleCommand, GenerateScheduleResult>
{
    private readonly IStaffShiftRepository _repo;

    public GenerateScheduleHandler(IStaffShiftRepository repo) => _repo = repo;

    public async Task<GenerateScheduleResult> Handle(GenerateScheduleCommand request, CancellationToken ct)
    {
        var summary = await _repo.GenerateScheduleAsync(request.WarehouseId, request.From, request.To, ct);
        return new GenerateScheduleResult
        {
            Message = summary.Message,
            Created = summary.Created,
            Skipped = summary.Skipped,
        };
    }
}
