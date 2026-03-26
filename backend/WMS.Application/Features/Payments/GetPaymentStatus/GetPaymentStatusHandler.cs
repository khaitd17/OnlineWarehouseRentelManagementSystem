using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Payments.GetPaymentStatus;

public class GetPaymentStatusHandler : IRequestHandler<GetPaymentStatusQuery, PaymentStatusResult>
{
    private readonly IRentalPaymentRepository _paymentRepo;

    public GetPaymentStatusHandler(IRentalPaymentRepository paymentRepo)
    {
        _paymentRepo = paymentRepo;
    }

    public async Task<PaymentStatusResult> Handle(GetPaymentStatusQuery request, CancellationToken cancellationToken)
    {
        var payment = await _paymentRepo.GetByIdAsync(request.PaymentId);

        if (payment == null)
            throw new InvalidOperationException($"Payment {request.PaymentId} not found");

        return new PaymentStatusResult
        {
            PaymentId = payment.PaymentId,
            PaymentCode = payment.PaymentCode,
            Status = payment.Status,
            Amount = payment.Amount,
            PaidAt = payment.PaidAt,
            ExpiredAt = payment.ExpiredAt,
            IsExpired = payment.IsExpired,
            SepayTransactionId = payment.SepayTransactionId,
            SepayReferenceCode = payment.SepayReferenceCode
        };
    }
}
