using MediatR;
using WMS.Application.Features.RentalContracts.Common;

namespace WMS.Application.Features.RentalContracts.GetContractsByWarehouse;

public class GetContractsByWarehouseQuery : IRequest<IEnumerable<RentalContractDto>>
{
    public int WarehouseId { get; set; }
    public int OwnerId { get; set; }
}
