using MediatR;

namespace WMS.Application.Features.Shifts.DeleteWarehouseShift;

public class DeleteWarehouseShiftCommand : IRequest
{
    public int Id { get; set; }
}
