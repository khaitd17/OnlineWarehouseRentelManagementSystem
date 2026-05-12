using MediatR;
using Microsoft.Extensions.Logging;
using WMS.Application.Interfaces;
using WMS.Domain.Enums;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Payments.RequestPaymentReupload;

public class RequestPaymentReuploadHandler : IRequestHandler<RequestPaymentReuploadCommand, RequestPaymentReuploadResult>
{
    private readonly IRentalPaymentRepository _paymentRepo;
    private readonly IRentalContractRepository _contractRepo;
    private readonly IWarehouseRepository _warehouseRepo;
    private readonly INotificationRepository _notificationRepo;
    private readonly INotificationSender _notificationSender;
    private readonly ILogger<RequestPaymentReuploadHandler> _logger;

    public RequestPaymentReuploadHandler(
        IRentalPaymentRepository paymentRepo,
        IRentalContractRepository contractRepo,
        IWarehouseRepository warehouseRepo,
        INotificationRepository notificationRepo,
        INotificationSender notificationSender,
        ILogger<RequestPaymentReuploadHandler> logger)
    {
        _paymentRepo = paymentRepo;
        _contractRepo = contractRepo;
        _warehouseRepo = warehouseRepo;
        _notificationRepo = notificationRepo;
        _notificationSender = notificationSender;
        _logger = logger;
    }

    public async Task<RequestPaymentReuploadResult> Handle(RequestPaymentReuploadCommand request, CancellationToken cancellationToken)
    {
        var payment = await _paymentRepo.GetByIdAsync(request.PaymentId);
        if (payment == null)
        {
            return new RequestPaymentReuploadResult
            {
                Success = false,
                Message = "Không tìm thấy thanh toán"
            };
        }

        if (payment.Status != PaymentStatus.PendingConfirmation)
        {
            return new RequestPaymentReuploadResult
            {
                Success = false,
                Message = "Chỉ có thể yêu cầu tải lại khi thanh toán đang chờ xác minh."
            };
        }

        var contract = await _contractRepo.GetByIdAsync(payment.ContractId);
        if (contract == null)
        {
            return new RequestPaymentReuploadResult
            {
                Success = false,
                Message = "Không tìm thấy hợp đồng"
            };
        }

        var warehouse = await _warehouseRepo.GetByIdAsync(contract.WarehouseId, cancellationToken);
        if (warehouse == null || warehouse.OwnerId != request.OwnerId)
        {
            return new RequestPaymentReuploadResult
            {
                Success = false,
                Message = "Bạn không có quyền yêu cầu tải lại chứng từ thanh toán này"
            };
        }

        payment.RequestProofReupload(request.Reason?.Trim());
        await _paymentRepo.UpdateAsync(payment);

        var reasonSuffix = string.IsNullOrWhiteSpace(request.Reason)
            ? ""
            : $" Lý do: {request.Reason.Trim()}";

        var notification = new Notification
        {
            UserId = contract.RenterId,
            Title = "⚠️ Yêu cầu tải lại chứng từ thanh toán",
            Message = $"Chủ kho yêu cầu bạn tải lại chứng từ thanh toán cho hợp đồng {contract.ContractNumber}.{reasonSuffix}",
            Type = "PAYMENT_PROOF_REUPLOAD",
            ReferenceId = payment.PaymentId,
            ReferenceType = "PAYMENT",
            CreatedAt = DateTime.UtcNow
        };

        await _notificationRepo.AddAsync(notification);
        await _notificationSender.SendToUserAsync(contract.RenterId, notification);

        _logger.LogInformation("Owner {OwnerId} requested payment proof reupload for payment {PaymentId}", request.OwnerId, payment.PaymentId);

        return new RequestPaymentReuploadResult
        {
            Success = true,
            Message = "Đã yêu cầu khách thuê tải lại chứng từ thanh toán."
        };
    }
}
