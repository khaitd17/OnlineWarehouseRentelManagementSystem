using MediatR;
using WMS.Domain.Entities;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;
using WMS.Application.Interfaces;

namespace WMS.Application.Features.Payments.RetryPayment;

public class RetryPaymentHandler : IRequestHandler<RetryPaymentCommand, RetryPaymentResult>
{
    private const int PaymentExpiryHours = 24;

    private readonly IRentalPaymentRepository _paymentRepository;
    private readonly IRentalContractRepository _contractRepository;
    private readonly INotificationRepository _notificationRepository;
    private readonly ISepayService _sepayService;

    public RetryPaymentHandler(
        IRentalPaymentRepository paymentRepository,
        IRentalContractRepository contractRepository,
        INotificationRepository notificationRepository,
        ISepayService sepayService)
    {
        _paymentRepository = paymentRepository;
        _contractRepository = contractRepository;
        _notificationRepository = notificationRepository;
        _sepayService = sepayService;
    }

    public async Task<RetryPaymentResult> Handle(RetryPaymentCommand request, CancellationToken cancellationToken)
    {
        var payment = await _paymentRepository.GetByIdAsync(request.PaymentId);
        if (payment == null)
        {
            return new RetryPaymentResult
            {
                Success = false,
                Message = "Payment not found"
            };
        }

        // Verify user owns this payment (via contract)
        var contract = await _contractRepository.GetByIdAsync(payment.ContractId);
        if (contract == null || contract.RenterId != request.UserId)
        {
            return new RetryPaymentResult
            {
                Success = false,
                Message = "Unauthorized to retry this payment"
            };
        }

        // Check if payment can be retried
        if (!payment.CanRetry)
        {
            return new RetryPaymentResult
            {
                Success = false,
                Message = $"Cannot retry payment. Status: {payment.Status}, Retry count: {payment.RetryCount}/{payment.MaxRetry}",
                RetryCount = payment.RetryCount,
                MaxRetry = payment.MaxRetry
            };
        }

        // Check if max retry reached
        if (payment.RetryCount >= payment.MaxRetry)
        {
            return new RetryPaymentResult
            {
                Success = false,
                Message = $"Maximum retry attempts ({payment.MaxRetry}) reached. Please create a new rental request.",
                RetryCount = payment.RetryCount,
                MaxRetry = payment.MaxRetry
            };
        }

        // Increment retry count and reset payment
        payment.IncrementRetry();
        
        // Set new expiry (24 hours from now)
        var expiredAtProp = payment.GetType().GetProperty("ExpiredAt");
        var newExpiry = DateTime.UtcNow.AddHours(PaymentExpiryHours);
        expiredAtProp?.SetValue(payment, newExpiry);

        await _paymentRepository.UpdateAsync(payment);

        // Generate new QR code info
        var qrInfo = _sepayService.GenerateQrInfo(payment.PaymentCode, payment.Amount, $"Thanh toan hop dong - Retry {payment.RetryCount}");

        // Update contract status back to PENDING_PAYMENT if it was cancelled
        if (contract.Status == RentalContractStatus.CancelledNoPayment || 
            contract.Status == RentalContractStatus.ExpiredPayment)
        {
            var statusProp = contract.GetType().GetProperty("Status");
            statusProp?.SetValue(contract, RentalContractStatus.PendingPayment);

            var cancelledAtProp = contract.GetType().GetProperty("CancelledAt");
            cancelledAtProp?.SetValue(contract, (DateTime?)null);

            var cancelledByProp = contract.GetType().GetProperty("CancelledBy");
            cancelledByProp?.SetValue(contract, (string?)null);

            await _contractRepository.UpdateAsync(contract);
        }

        // Send notification
        var notification = Notification.Create(
            receiverUserId: contract.RenterId,
            title: "Thanh toán đã được khởi tạo lại",
            message: $"Thanh toán cho hợp đồng {contract.ContractNumber} đã được khởi tạo lại (lần {payment.RetryCount}/{payment.MaxRetry}). Bạn có 24 giờ để hoàn tất.",
            notificationType: "IN_APP",
            referenceId: payment.PaymentId,
            referenceType: "RentalPayment"
        );
        await _notificationRepository.AddAsync(notification);

        return new RetryPaymentResult
        {
            Success = true,
            Message = "Payment retry initiated successfully",
            PaymentCode = payment.PaymentCode,
            QrCodeUrl = qrInfo.QrImageUrl,
            RetryCount = payment.RetryCount,
            MaxRetry = payment.MaxRetry,
            NewExpiry = newExpiry
        };
    }
}
