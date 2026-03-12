using MediatR;
using WMS.Application.Features.RentalContracts.Common;

namespace WMS.Application.Features.RentalContracts.GetRentalContractById;

public class GetRentalContractByIdQuery : IRequest<RentalContractDto?>
{
    public int ContractId { get; set; }
    public int UserId { get; set; } // For authorization
}
