using MediatR;
using WMS.Application.Features.RentalContracts.Common;

namespace WMS.Application.Features.RentalContracts.GetMyRentalContracts;

public class GetMyRentalContractsQuery : IRequest<IEnumerable<RentalContractDto>>
{
    public int UserId { get; set; }
}
