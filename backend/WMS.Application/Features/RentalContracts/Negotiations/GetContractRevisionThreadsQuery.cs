using MediatR;

namespace WMS.Application.Features.RentalContracts.Negotiations;

public class GetContractRevisionThreadsQuery : IRequest<List<ContractRevisionThreadDto>>
{
    public int ContractId { get; set; }
    public int UserId { get; set; }
}
