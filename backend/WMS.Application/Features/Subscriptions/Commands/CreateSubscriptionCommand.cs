using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;

namespace WMS.Application.Features.Subscriptions.Commands;

public class CreateSubscriptionCommand : IRequest<CreateSubscriptionResult>
{
    public int UserId { get; set; }
    public string Plan { get; set; } = null!;
}

public class CreateSubscriptionResult
{
    public bool Success { get; set; }
    public string Message { get; set; }
    public QrPaymentInfo PaymentInfo { get; set; }
}
