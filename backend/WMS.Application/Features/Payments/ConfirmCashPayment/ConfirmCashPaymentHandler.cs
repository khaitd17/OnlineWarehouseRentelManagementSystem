using MediatR;
using Microsoft.Extensions.Logging;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Payments.ConfirmCashPayment;

public class ConfirmCashPaymentHandler : IRequestHandler<ConfirmCashPaymentCommand, ConfirmCashPaymentResult>
{
    private readonly IRentalPaymentRepository _paymentRepo;
    private readonly IRentalContractRepository _contractRepo;
    private readonly IWarehouseRepository _warehouseRepo;
    private readonly INotificationRepository _notificationRepo;
    private readonly INotificationSender _notificationSender;
    private readonly ILogger<ConfirmCashPaymentHandler> _logger;

    public ConfirmCashPaymentHandler(
        IRentalPaymentRepository paymentRepo,
        IRentalContractRepository contractRepo,
        IWarehouseRepository warehouseRepo,
        INotificationRepository notificationRepo,
        INotificationSender notificationSender,
        ILogger<ConfirmCashPaymentHandler> logger)
    {
        _paymentRepo = paymentRepo;
        _contractRepo = contractRepo;
        _warehouseRepo = warehouseRepo;
        _notificationRepo = notificationRepo;
        _notificationSender = notificationSender;
        _logger = logger;
    }

    public async Task<ConfirmCashPaymentResult> Handle(ConfirmCashPaymentCommand request, CancellationToken cancellationToken)
    {
        var payment = await _paymentRepo.GetByIdAsync(request.PaymentId);
        if (payment == null)
        {
            return new ConfirmCashPaymentResult
            {
                Success = false,
                Message = "Không tìm thấy thanh toán"
            };
        }

        // Check if payment is pending confirmation
        if (payment.Status != "PENDING_CONFIRMATION")
        {
            return new ConfirmCashPaymentResult
            {
                Success = false,
                Message = $"Thanh toán không ở trạng thái chờ xác nhận (hiện tại: {payment.Status})"
            };
        }

        var contract = await _contractRepo.GetByIdAsync(payment.ContractId);
        if (contract == null)
        {
            return new ConfirmCashPaymentResult
            {
                Success = false,
                Message = "Không tìm thấy hợp đồng"
            };
        }

        // Verify owner permission
        var warehouse = await _warehouseRepo.GetByIdAsync(contract.WarehouseId, cancellationToken);
        if (warehouse == null || warehouse.OwnerId != request.OwnerId)
        {
            return new ConfirmCashPaymentResult
            {
                Success = false,
                Message = "Bạn không có quyền xác nhận thanh toán này"
            };
        }

        if (request.IsApproved)
        {
            // Complete the payment
            payment.Status = PaymentStatus.Completed;

            // Activate the contract
            if (contract.Status == RentalContractStatus.PendingPayment)
            {
                contract.ActivateAfterPayment();
            }
            else
            {
                // For other statuses, set status directly via reflection (since Status is private set)
                var statusProp = typeof(RentalContract).GetProperty("Status");
                statusProp?.SetValue(contract, RentalContractStatus.Active);
            }

            await _paymentRepo.UpdateAsync(payment);
            await _contractRepo.UpdateAsync(contract);

            // Send notification to renter
            var notification = new Notification
            {
                UserId = contract.RenterId,
                Title = "Thanh toán đã được xác nhận",
                Message = $"Chủ kho đã xác nhận thanh toán tiền mặt cho hợp đồng {contract.ContractNumber}. Hợp đồng đã được kích hoạt!",
                Type = "PAYMENT_CONFIRMED",
                ReferenceId = contract.ContractId,
                ReferenceType = "CONTRACT",
                CreatedAt = DateTime.UtcNow
            };

            await _notificationRepo.AddAsync(notification);
            await _notificationSender.SendToUserAsync(contract.RenterId, notification);

            _logger.LogInformation("Cash payment {PaymentId} confirmed by owner {OwnerId}", request.PaymentId, request.OwnerId);

            return new ConfirmCashPaymentResult
            {
                Success = true,
                Message = "Đã xác nhận thanh toán thành công. Hợp đồng đã được kích hoạt.",
                NewContractStatus = contract.Status
            };
        }
        else
        {
            // Reject the payment
            payment.Status = PaymentStatus.Cancelled;

            await _paymentRepo.UpdateAsync(payment);

            // Send notification to renter
            var notification = new Notification
            {
                UserId = contract.RenterId,
                Title = "Thanh toán bị từ chối",
                Message = $"Chủ kho đã từ chối xác nhận thanh toán tiền mặt cho hợp đồng {contract.ContractNumber}. Lý do: {request.RejectionReason ?? "Không có lý do"}",
                Type = "PAYMENT_REJECTED",
                ReferenceId = contract.ContractId,
                ReferenceType = "CONTRACT",
                CreatedAt = DateTime.UtcNow
            };

            await _notificationRepo.AddAsync(notification);
            await _notificationSender.SendToUserAsync(contract.RenterId, notification);

            _logger.LogInformation("Cash payment {PaymentId} rejected by owner {OwnerId}. Reason: {Reason}",
                request.PaymentId, request.OwnerId, request.RejectionReason);

            return new ConfirmCashPaymentResult
            {
                Success = true,
                Message = "Đã từ chối thanh toán.",
                NewContractStatus = contract.Status
            };
        }
    }
}
