using MediatR;

namespace WMS.Application.Features.WarehouseGrid.RemoveGridLocation;

public class RemoveGridLocationCommand : IRequest
{
    public int WarehouseId { get; set; }
    public int Id { get; set; }
    public int QuantityToRemove { get; set; }
}
