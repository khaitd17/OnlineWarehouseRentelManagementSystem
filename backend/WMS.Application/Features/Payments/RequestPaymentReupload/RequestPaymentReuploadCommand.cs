using MediatR;

namespace WMS.Application.Features.Payments.RequestPaymentReupload;

public class RequestPaymentReuploadCommand : IRequest<RequestPaymentReuploadResult>
{
    public int PaymentId { get; set; }
    public int OwnerId { get; set; }
    public string? Reason { get; set; }
}

public class RequestPaymentReuploadResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = null!;
}
