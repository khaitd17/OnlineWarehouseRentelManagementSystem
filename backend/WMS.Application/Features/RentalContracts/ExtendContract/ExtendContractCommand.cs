using MediatR;

namespace WMS.Application.Features.RentalContracts.ExtendContract;

public class ExtendContractCommand : IRequest<ExtendContractResult>
{
    public int ContractId { get; set; }
    public int ExtensionMonths { get; set; }
    public int RequestedBy { get; set; }
}

public class ExtendContractResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = null!;
    public int? PaymentId { get; set; }
    public string? PaymentCode { get; set; }
    public string? QrCodeUrl { get; set; }
    public decimal? ExtensionAmount { get; set; }
    public DateTime? NewEndDate { get; set; }
}
