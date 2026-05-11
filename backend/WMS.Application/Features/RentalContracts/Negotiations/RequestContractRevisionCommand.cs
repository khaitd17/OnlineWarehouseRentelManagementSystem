using MediatR;

namespace WMS.Application.Features.RentalContracts.Negotiations;

public class RequestContractRevisionCommand : IRequest<RequestContractRevisionResult>
{
    public int ContractId { get; set; }
    public int UserId { get; set; }
    public string Section { get; set; } = null!;
    public string Message { get; set; } = null!;
}

public class RequestContractRevisionResult
{
    public int ThreadId { get; set; }
    public string Status { get; set; } = null!;
}
