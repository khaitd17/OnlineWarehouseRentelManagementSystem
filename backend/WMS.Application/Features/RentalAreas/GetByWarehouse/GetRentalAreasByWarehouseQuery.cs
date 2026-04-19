using MediatR;

namespace WMS.Application.Features.RentalAreas.GetByWarehouse;

public class GetRentalAreasByWarehouseQuery : IRequest<List<RentalAreaDto>>
{
    public int WarehouseId { get; set; }
}
