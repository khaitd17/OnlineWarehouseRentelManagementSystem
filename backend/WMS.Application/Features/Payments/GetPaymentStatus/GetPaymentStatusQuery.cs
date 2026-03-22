using MediatR;

namespace WMS.Application.Features.Payments.GetPaymentStatus;

public class GetPaymentStatusQuery : IRequest<PaymentStatusResult>
{
    public int PaymentId { get; set; }
}

public class PaymentStatusResult
{
    public int PaymentId { get; set; }
    public string PaymentCode { get; set; } = null!;
    public string Status { get; set; } = null!;
    public decimal Amount { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime? ExpiredAt { get; set; }
    public bool IsExpired { get; set; }
    public int? SepayTransactionId { get; set; }
    public string? SepayReferenceCode { get; set; }
}
