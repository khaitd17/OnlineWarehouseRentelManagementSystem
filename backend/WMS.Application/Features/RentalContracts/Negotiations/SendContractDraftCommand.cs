using MediatR;

namespace WMS.Application.Features.RentalContracts.Negotiations;

public class SendContractDraftCommand : IRequest<SendContractDraftResult>
{
    public int ContractId { get; set; }
    public int UserId { get; set; }
}

public class SendContractDraftResult
{
    public string Status { get; set; } = null!;
}
