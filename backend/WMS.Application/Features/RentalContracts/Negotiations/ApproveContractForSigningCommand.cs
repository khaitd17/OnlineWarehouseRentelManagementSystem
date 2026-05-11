using MediatR;

namespace WMS.Application.Features.RentalContracts.Negotiations;

public class ApproveContractForSigningCommand : IRequest<ApproveContractForSigningResult>
{
    public int ContractId { get; set; }
    public int UserId { get; set; }
}

public class ApproveContractForSigningResult
{
    public string Status { get; set; } = null!;
}
