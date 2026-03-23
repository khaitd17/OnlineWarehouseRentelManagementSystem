using MediatR;
using WMS.Application.Features.RentalContracts.Common;

namespace WMS.Application.Features.RentalContracts.GetMyRentalContracts;

public class GetMyRentalContractsQuery : IRequest<IEnumerable<RentalContractDto>>
{
    public int UserId { get; set; }
    public int? WarehouseId { get; set; } // If set, filter contracts by warehouse (for owner view)
}
