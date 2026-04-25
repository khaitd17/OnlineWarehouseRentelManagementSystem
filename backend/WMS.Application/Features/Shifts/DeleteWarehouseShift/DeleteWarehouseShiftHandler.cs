using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Shifts.DeleteWarehouseShift;

public class DeleteWarehouseShiftHandler : IRequestHandler<DeleteWarehouseShiftCommand>
{
    private readonly IStaffShiftRepository _repo;

    public DeleteWarehouseShiftHandler(IStaffShiftRepository repo) => _repo = repo;

    public Task Handle(DeleteWarehouseShiftCommand request, CancellationToken ct)
        => _repo.DeleteWarehouseShiftAsync(request.Id, ct);
}
