using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Payments.GetPaymentQrInfo;

public class GetPaymentQrInfoHandler : IRequestHandler<GetPaymentQrInfoQuery, PaymentQrInfoResult>
{
    private readonly IRentalPaymentRepository _paymentRepo;
    private readonly ISepayService _sepayService;

    public GetPaymentQrInfoHandler(IRentalPaymentRepository paymentRepo, ISepayService sepayService)
    {
        _paymentRepo = paymentRepo;
        _sepayService = sepayService;
    }

    public async Task<PaymentQrInfoResult> Handle(GetPaymentQrInfoQuery request, CancellationToken cancellationToken)
    {
        var payment = await _paymentRepo.GetByIdAsync(request.PaymentId);

        if (payment == null)
            throw new InvalidOperationException($"Payment {request.PaymentId} not found");

        var qrInfo = _sepayService.GenerateQrInfo(
            paymentCode: payment.PaymentCode,
            amount: payment.Amount,
            description: $"Thanh toan hop dong thue kho {payment.PaymentCode}"
        );

        return new PaymentQrInfoResult
        {
            PaymentId = payment.PaymentId,
            PaymentCode = payment.PaymentCode,
            BankName = qrInfo.BankName,
            AccountNumber = qrInfo.AccountNumber,
            AccountName = qrInfo.AccountName,
            Amount = payment.Amount,
            Description = qrInfo.Description,
            QrImageUrl = qrInfo.QrImageUrl,
            Status = payment.Status,
            ExpiredAt = payment.ExpiredAt,
            IsExpired = payment.IsExpired
        };
    }
}
