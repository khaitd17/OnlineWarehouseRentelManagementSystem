using MediatR;

namespace WMS.Application.Features.RentalContracts.Negotiations;

public class GetContractVersionsQuery : IRequest<List<ContractVersionDto>>
{
    public int ContractId { get; set; }
    public int UserId { get; set; }
}
