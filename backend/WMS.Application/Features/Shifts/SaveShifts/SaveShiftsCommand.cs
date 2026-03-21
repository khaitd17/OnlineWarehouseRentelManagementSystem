using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Shifts.SaveShifts;

public class SaveShiftsCommand : IRequest
{
    public List<UpsertShiftDto> Shifts { get; set; } = new();
}
