using MediatR;

namespace WMS.Application.Features.Payments.GetPaymentQrInfo;

public class GetPaymentQrInfoQuery : IRequest<PaymentQrInfoResult>
{
    public int PaymentId { get; set; }
}

public class PaymentQrInfoResult
{
    public int PaymentId { get; set; }
    public string PaymentCode { get; set; } = null!;
    public string BankName { get; set; } = null!;
    public string AccountNumber { get; set; } = null!;
    public string AccountName { get; set; } = null!;
    public decimal Amount { get; set; }
    public string Description { get; set; } = null!;
    public string QrImageUrl { get; set; } = null!;
    public string Status { get; set; } = null!;
    public DateTime? ExpiredAt { get; set; }
    public bool IsExpired { get; set; }
}
