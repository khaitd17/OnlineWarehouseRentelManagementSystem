using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Refunds.ProcessRefund;

public class ProcessRefundHandler : IRequestHandler<ProcessRefundCommand, ProcessRefundResult>
{
    private readonly IRentalContractRepository _contractRepository;
    private readonly IRentalPaymentRepository _paymentRepository;
    private readonly IRefundRepository _refundRepository;
    private readonly INotificationRepository _notificationRepository;

    public ProcessRefundHandler(
        IRentalContractRepository contractRepository,
        IRentalPaymentRepository paymentRepository,
        IRefundRepository refundRepository,
        INotificationRepository notificationRepository)
    {
        _contractRepository = contractRepository;
        _paymentRepository = paymentRepository;
        _refundRepository = refundRepository;
        _notificationRepository = notificationRepository;
    }

    public async Task<ProcessRefundResult> Handle(ProcessRefundCommand request, CancellationToken cancellationToken)
    {
        // 1. Load contract with related data
        var contract = await _contractRepository.GetByIdWithDetailsAsync(request.ContractId);

        if (contract == null)
        {
            return new ProcessRefundResult
            {
                Success = false,
                Message = "Không tìm thấy hợp đồng"
            };
        }

        // 2. Find paid payments for this contract
        var paidPayments = await _paymentRepository.GetCompletedByContractIdAsync(request.ContractId);

        if (!paidPayments.Any())
        {
            return new ProcessRefundResult
            {
                Success = true,
                Message = "Không có khoản thanh toán nào cần hoàn trả",
                RefundAmount = 0,
                CancellationFee = 0,
                IsWithinGracePeriod = true
            };
        }

        // 3. Calculate grace period and fees
        var totalPaid = paidPayments.Sum(p => p.Amount);
        var gracePeriodHours = contract.GracePeriodHours > 0 ? contract.GracePeriodHours : 24;
        var isWithinGracePeriod = contract.SignedAt.HasValue && 
            DateTime.UtcNow <= contract.SignedAt.Value.AddHours(gracePeriodHours);

        decimal cancellationFee = 0;
        decimal refundAmount = totalPaid;

        if (!isWithinGracePeriod)
        {
            // After grace period: charge fee (e.g., 10% of total paid or 1 month rent)
            var cancellationFeePercent = contract.CancellationFee ?? 10m;
            cancellationFee = Math.Round(totalPaid * cancellationFeePercent / 100, 0);
            refundAmount = totalPaid - cancellationFee;
        }

        if (refundAmount <= 0)
        {
            return new ProcessRefundResult
            {
                Success = true,
                Message = "Không có khoản nào được hoàn trả do phí hủy",
                RefundAmount = 0,
                CancellationFee = cancellationFee,
                IsWithinGracePeriod = false
            };
        }

        // 4. Create refund record
        var refund = Refund.Create(
            paymentId: request.PaymentId ?? paidPayments.First().PaymentId,
            contractId: request.ContractId,
            amount: refundAmount,
            reason: request.Reason
        );

        await _refundRepository.AddAsync(refund);

        // 5. Notify renter about refund
        var notification = Notification.Create(
            receiverUserId: contract.RenterId,
            title: "Yêu cầu hoàn tiền đã được tạo",
            message: $"Yêu cầu hoàn tiền {refundAmount:N0} VNĐ cho hợp đồng {contract.ContractNumber} đã được tạo. " +
                     (cancellationFee > 0 ? $"Phí hủy: {cancellationFee:N0} VNĐ." : "Không có phí hủy."),
            notificationType: "IN_APP",
            referenceId: refund.RefundId,
            referenceType: "Refund"
        );
        await _notificationRepository.AddAsync(notification);

        return new ProcessRefundResult
        {
            Success = true,
            Message = isWithinGracePeriod 
                ? "Hoàn tiền 100% (trong thời gian grace period)" 
                : $"Hoàn tiền sau khi trừ phí hủy {cancellationFee:N0} VNĐ",
            RefundId = refund.RefundId,
            RefundAmount = refundAmount,
            CancellationFee = cancellationFee,
            IsWithinGracePeriod = isWithinGracePeriod
        };
    }
}
