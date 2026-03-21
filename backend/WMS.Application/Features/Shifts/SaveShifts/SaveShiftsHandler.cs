using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Shifts.SaveShifts;

public class SaveShiftsHandler : IRequestHandler<SaveShiftsCommand>
{
    private readonly IStaffShiftRepository _repo;

    public SaveShiftsHandler(IStaffShiftRepository repo) => _repo = repo;

    public Task Handle(SaveShiftsCommand request, CancellationToken cancellationToken)
        => _repo.SaveShiftsAsync(request.Shifts, cancellationToken);
}
