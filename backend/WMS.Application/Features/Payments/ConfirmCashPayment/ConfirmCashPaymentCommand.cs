using MediatR;

namespace WMS.Application.Features.Payments.ConfirmCashPayment;

public class ConfirmCashPaymentCommand : IRequest<ConfirmCashPaymentResult>
{
    public int PaymentId { get; set; }
    public int OwnerId { get; set; } // Will be set from controller
    public bool IsApproved { get; set; }
    public string? RejectionReason { get; set; }
}

public class ConfirmCashPaymentResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = null!;
    public string? NewContractStatus { get; set; }
}
