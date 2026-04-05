using MediatR;

namespace WMS.Application.Features.RentalContracts.DeclineContract;

public class DeclineContractCommand : IRequest<Unit>
{
    public int ContractId { get; set; }
    public int UserId { get; set; }
    public string Reason { get; set; } = null!;
}
