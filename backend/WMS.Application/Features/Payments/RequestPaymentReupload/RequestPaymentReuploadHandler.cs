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
    private readonly IUserRepository _userRepository;
    private readonly IEmailService _emailService;

    public RequestPaymentReuploadHandler(
        IRentalPaymentRepository paymentRepo,
        IRentalContractRepository contractRepo,
        IWarehouseRepository warehouseRepo,
        INotificationRepository notificationRepo,
        INotificationSender notificationSender,
        IUserRepository userRepository,
        IEmailService emailService,
        ILogger<RequestPaymentReuploadHandler> logger)
    {
        _paymentRepo = paymentRepo;
        _contractRepo = contractRepo;
        _warehouseRepo = warehouseRepo;
        _notificationRepo = notificationRepo;
        _notificationSender = notificationSender;
        _userRepository = userRepository;
        _emailService = emailService;
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

        var renter = await _userRepository.GetByIdAsync(contract.RenterId, cancellationToken);
        if (renter != null && !string.IsNullOrWhiteSpace(renter.Email))
        {
            var subject = $"Yêu cầu tải lại chứng từ thanh toán - {contract.ContractNumber}";
            var contractLink = $"http://localhost:3000/contracts/{contract.ContractId}/payment";
            var htmlContent = $@"
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;'>
    <h2 style='color: #f59e0b; text-align: center;'>Yêu cầu tải lại chứng từ thanh toán</h2>
    <p>Xin chào <strong>{renter.FullName}</strong>,</p>
    <p>Chủ kho yêu cầu bạn tải lại chứng từ thanh toán cho hợp đồng <strong>{contract.ContractNumber}</strong>.</p>
    {(string.IsNullOrWhiteSpace(request.Reason) ? "" : $"<div style='background-color: #fffbeb; padding: 15px; border-radius: 6px; margin: 16px 0; border-left: 4px solid #f59e0b;'><p style='margin: 0; color: #92400e;'><strong>Lý do:</strong> {request.Reason.Trim()}</p></div>")}
    <div style='margin-top: 24px; text-align: center;'>
        <a href='{contractLink}' style='background-color: #f59e0b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;'>Gửi lại chứng từ</a>
    </div>
    <hr style='border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;' />
    <p style='font-size: 12px; color: #9ca3af; text-align: center;'>Đây là email tự động từ hệ thống OWRMS. Vui lòng không trả lời email này.</p>
</div>";

            await _emailService.SendInfo(renter.Email, renter.FullName, subject, htmlContent);
        }

        _logger.LogInformation("Owner {OwnerId} requested payment proof reupload for payment {PaymentId}", request.OwnerId, payment.PaymentId);

        return new RequestPaymentReuploadResult
        {
            Success = true,
            Message = "Đã yêu cầu khách thuê tải lại chứng từ thanh toán."
        };
    }
}
