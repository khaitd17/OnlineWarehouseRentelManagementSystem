using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Shifts.CreateWarehouseShift;

public class CreateWarehouseShiftHandler : IRequestHandler<CreateWarehouseShiftCommand, int>
{
    private readonly IStaffShiftRepository _repo;

    public CreateWarehouseShiftHandler(IStaffShiftRepository repo) => _repo = repo;

    public Task<int> Handle(CreateWarehouseShiftCommand request, CancellationToken ct)
        => _repo.CreateWarehouseShiftAsync(
            request.WarehouseId,
            request.Name,
            request.StartTime,
            request.EndTime,
            ct);
}
