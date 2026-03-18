using MediatR;

namespace WMS.Application.Features.RentalContracts.SignContract;

public class SignContractCommand : IRequest<SignContractResult>
{
    public int ContractId { get; set; }
    public int UserId { get; set; }
    public string SignatureBase64 { get; set; } = null!;
    public string? IpAddress { get; set; }
}

public class SignContractResult
{
    public string SignedFileUrl { get; set; } = null!;
    public string Status { get; set; } = null!;
}
