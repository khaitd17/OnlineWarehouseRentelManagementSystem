using MediatR;
using WMS.Domain.Entities;

namespace WMS.Application.Features.RentalAreas.GetByWarehouse;

public class GetRentalAreasByWarehouseQuery : IRequest<List<RentalArea>>
{
    public int WarehouseId { get; set; }
}
