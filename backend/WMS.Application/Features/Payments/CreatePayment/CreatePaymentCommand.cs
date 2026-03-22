using MediatR;

namespace WMS.Application.Features.Payments.CreatePayment;

public class CreatePaymentCommand : IRequest<CreatePaymentResult>
{
    public int ContractId { get; set; }
    public string PaymentType { get; set; } = "DEPOSIT";
    public decimal? AmountOverride { get; set; }
}

public class CreatePaymentResult
{
    public int PaymentId { get; set; }
    public string PaymentCode { get; set; } = null!;
    public decimal Amount { get; set; }
    public string Status { get; set; } = null!;
    public DateTime? ExpiredAt { get; set; }
}
