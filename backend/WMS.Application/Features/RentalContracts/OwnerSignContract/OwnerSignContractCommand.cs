using MediatR;

namespace WMS.Application.Features.RentalContracts.OwnerSignContract;

public class OwnerSignContractCommand : IRequest<OwnerSignContractResult>
{
    public int ContractId { get; set; }
    public int OwnerId { get; set; }
    public string SignatureBase64 { get; set; } = null!;
}

public class OwnerSignContractResult
{
    public string OwnerSignedFileUrl { get; set; } = null!;
    public string Status { get; set; } = null!;
}
