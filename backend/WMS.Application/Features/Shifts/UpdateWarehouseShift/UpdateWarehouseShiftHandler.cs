using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Shifts.UpdateWarehouseShift;

public class UpdateWarehouseShiftHandler : IRequestHandler<UpdateWarehouseShiftCommand, Unit>
{
    private readonly IStaffShiftRepository _repo;

    public UpdateWarehouseShiftHandler(IStaffShiftRepository repo)
    {
        _repo = repo;
    }

    public async Task<Unit> Handle(UpdateWarehouseShiftCommand request, CancellationToken cancellationToken)
    {
        await _repo.UpdateWarehouseShiftAsync(request.Id, request.Name, request.StartTime, request.EndTime, cancellationToken);
        return Unit.Value;
    }
}
