using MediatR;

namespace WMS.Application.Features.Payments.RetryPayment;

public class RetryPaymentCommand : IRequest<RetryPaymentResult>
{
    public int PaymentId { get; set; }
    public int UserId { get; set; }
}

public class RetryPaymentResult
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public string? PaymentCode { get; set; }
    public string? QrCodeUrl { get; set; }
    public int RetryCount { get; set; }
    public int MaxRetry { get; set; }
    public DateTime? NewExpiry { get; set; }
}
