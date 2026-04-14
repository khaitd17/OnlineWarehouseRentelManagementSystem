using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Shifts.SaveShifts;

public class SaveShiftsCommand : IRequest
{
    public int CallerId { get; set; }
    public int? WarehouseId { get; set; }  // dùng để check quyền trong handler
    public List<UpsertShiftDto> Shifts { get; set; } = new();
}
