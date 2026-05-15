using MediatR;
using Microsoft.Extensions.Logging;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;


namespace WMS.Application.Features.Payments.ProcessSepayWebhook;

public class ProcessSepayWebhookHandler : IRequestHandler<ProcessSepayWebhookCommand, WebhookCommandResult>
{
    private readonly ISepayService _sepayService;
    private readonly IRentalPaymentRepository _paymentRepo;
    private readonly IRentalContractRepository _contractRepo;
    private readonly INotificationRepository _notificationRepo;
    private readonly INotificationSender _notificationSender;
    private readonly ILogger<ProcessSepayWebhookHandler> _logger;
    private readonly ISubscriptionRepository _subscriptionRepo;
    private readonly IWarehouseRepository _warehouseRepo;
    private readonly IUserRepository _userRepo;
    private readonly IEmailService _emailService;

    public ProcessSepayWebhookHandler(
        ISepayService sepayService,
        IRentalPaymentRepository paymentRepo,
        IRentalContractRepository contractRepo,
        INotificationRepository notificationRepo,
        INotificationSender notificationSender,
        ISubscriptionRepository subscriptionRepo,
        IWarehouseRepository warehouseRepo,
        IUserRepository userRepo,
        IEmailService emailService,
        ILogger<ProcessSepayWebhookHandler> logger)
    {
        _sepayService = sepayService;
        _paymentRepo = paymentRepo;
        _contractRepo = contractRepo;
        _notificationRepo = notificationRepo;
        _notificationSender = notificationSender;
        _subscriptionRepo = subscriptionRepo;
        _warehouseRepo = warehouseRepo;
        _userRepo = userRepo;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<WebhookCommandResult> Handle(ProcessSepayWebhookCommand request, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Processing SePay webhook from IP: {IpAddress}, Transaction: {TransactionId}",
                request.IpAddress, request.Id);

            // Validate IP whitelist
            if (!_sepayService.IsValidSepayIp(request.IpAddress ?? ""))
            {
                _logger.LogWarning("Invalid IP address: {IpAddress}", request.IpAddress);
                return new WebhookCommandResult
                {
                    Success = false,
                    Message = "Invalid IP address"
                };
            }

            // Convert to payload
            var payload = new SepayWebhookPayload
            {
                Id = request.Id,
                Gateway = request.Gateway,
                TransactionDate = request.TransactionDate,
                AccountNumber = request.AccountNumber,
                Code = request.Code,
                Content = request.Content,
                TransferType = request.TransferType,
                TransferAmount = request.TransferAmount,
                Accumulated = request.Accumulated,
                SubAccount = request.SubAccount,
                ReferenceCode = request.ReferenceCode,
                Description = request.Description
            };

            // Process webhook
            var result = await _sepayService.ProcessWebhookAsync(payload);

            if (result.Success && result.PaymentId.HasValue)
            {
                if (result.PaymentType == "SUBSCRIPTION")
                {
                    var subscription = await _subscriptionRepo.GetByIdAsync(result.PaymentId.Value);
                    if (subscription != null)
                    {
                        var notification = new Notification
                        {
                            UserId = subscription.UserId,
                            Title = "Đăng ký gói thành công",
                            Message = $"Giao dịch {result.PaymentCode} thành công. Gói {subscription.Plan} đã được kích hoạt/gia hạn đến {subscription.EndDate?.ToString("dd/MM/yyyy")}.",
                            Type = "SUBSCRIPTION_ACTIVE",
                            ReferenceId = subscription.SubscriptionId,
                            ReferenceType = "SUBSCRIPTION",
                            CreatedAt = DateTime.UtcNow
                        };

                        await _notificationRepo.AddAsync(notification);
                        await _notificationSender.SendToUserAsync(subscription.UserId, notification);
                        _logger.LogInformation("Sent subscription notification to user {UserId}", subscription.UserId);
                    }
                }
                else
                {
                    // Get contract to send notification
                    var payment = await _paymentRepo.GetByIdAsync(result.PaymentId.Value);

                    if (payment != null)
                    {
                        var contract = payment.Contract;
                        if (contract == null)
                        {
                            _logger.LogWarning("Payment {PaymentId} has no contract data", payment.PaymentId);
                            return new WebhookCommandResult
                            {
                                Success = result.Success,
                                Message = result.ErrorMessage,
                                PaymentCode = result.PaymentCode,
                                PaymentId = result.PaymentId
                            };
                        }

                        var isTerminationFeePayment = payment.PaymentType == PaymentType.Penalty;
                        var isExtensionPayment = payment.PaymentType == PaymentType.Extension;

                        // Send notification to renter
                        var notification = new Notification
                        {
                            UserId = contract.RenterId,
                            Title = isTerminationFeePayment
                                ? "Thanh toán phí kết thúc sớm thành công"
                                : isExtensionPayment
                                    ? "Thanh toán gia hạn thành công"
                                    : "Thanh toán thành công",
                            Message = isTerminationFeePayment
                                ? $"Thanh toán {result.PaymentCode} đã được xác nhận. Hợp đồng {contract.ContractNumber} đã được kết thúc sớm."
                                : isExtensionPayment
                                    ? $"Thanh toán {result.PaymentCode} đã được xác nhận. Hợp đồng {contract.ContractNumber} đã được gia hạn thành công."
                                    : $"Thanh toán {result.PaymentCode} đã được xác nhận. Hợp đồng {contract.ContractNumber} đã được kích hoạt.",
                            Type = isTerminationFeePayment
                                ? "TERMINATION_FEE_PAID"
                                : isExtensionPayment
                                    ? "EXTENSION_PAYMENT_COMPLETED"
                                    : "PAYMENT_COMPLETED",
                            ReferenceId = contract.ContractId,
                            ReferenceType = "CONTRACT",
                            CreatedAt = DateTime.UtcNow
                        };

                        await _notificationRepo.AddAsync(notification);
                        await _notificationSender.SendToUserAsync(contract.RenterId, notification);

                        var warehouse = await _warehouseRepo.GetByIdAsync(contract.WarehouseId, cancellationToken);
                        var renter = await _userRepo.GetByIdAsync(contract.RenterId, cancellationToken);
                        var owner = warehouse != null
                            ? await _userRepo.GetByIdAsync(warehouse.OwnerId, cancellationToken)
                            : null;

                        var paymentLabel = isTerminationFeePayment
                            ? "phí kết thúc sớm"
                            : isExtensionPayment
                                ? "gia hạn hợp đồng"
                                : "thanh toán hợp đồng";
                        var subject = isTerminationFeePayment
                            ? "Thanh toán phí kết thúc sớm thành công"
                            : isExtensionPayment
                                ? "Thanh toán gia hạn thành công"
                                : "Thanh toán thành công";
                        var contractLink = $"http://localhost:3000/contracts/{contract.ContractId}";
                        var paymentCode = !string.IsNullOrWhiteSpace(payment.PaymentCode)
                            ? payment.PaymentCode
                            : result.PaymentCode;

                        if (renter != null && !string.IsNullOrWhiteSpace(renter.Email))
                        {
                            var htmlContent = $@"
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;'>
    <h2 style='color: #16a34a; text-align: center;'>Thanh toán thành công</h2>
    <p>Xin chào <strong>{renter.FullName}</strong>,</p>
    <p>{paymentLabel} cho hợp đồng <strong>{contract.ContractNumber}</strong> đã được xác nhận.</p>
    <div style='background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 16px 0;'>
        <ul style='color: #4b5563; line-height: 1.6;'>
            <li><strong>Số tiền:</strong> {payment.Amount:N0} VNĐ</li>
            <li><strong>Mã thanh toán:</strong> {paymentCode}</li>
        </ul>
    </div>
    <div style='margin-top: 24px; text-align: center;'>
        <a href='{contractLink}' style='background-color: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;'>Xem hợp đồng</a>
    </div>
    <hr style='border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;' />
    <p style='font-size: 12px; color: #9ca3af; text-align: center;'>Đây là email tự động từ hệ thống OWRMS. Vui lòng không trả lời email này.</p>
</div>";

                            await _emailService.SendInfo(renter.Email, renter.FullName, subject, htmlContent);
                        }

                        if (owner != null && !string.IsNullOrWhiteSpace(owner.Email))
                        {
                            var htmlContent = $@"
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;'>
    <h2 style='color: #16a34a; text-align: center;'>Thanh toán thành công</h2>
    <p>Xin chào <strong>{owner.FullName}</strong>,</p>
    <p>{paymentLabel} cho hợp đồng <strong>{contract.ContractNumber}</strong> đã được xác nhận.</p>
    <div style='background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 16px 0;'>
        <ul style='color: #4b5563; line-height: 1.6;'>
            <li><strong>Số tiền:</strong> {payment.Amount:N0} VNĐ</li>
            <li><strong>Mã thanh toán:</strong> {paymentCode}</li>
        </ul>
    </div>
    <div style='margin-top: 24px; text-align: center;'>
        <a href='{contractLink}' style='background-color: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;'>Xem hợp đồng</a>
    </div>
    <hr style='border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;' />
    <p style='font-size: 12px; color: #9ca3af; text-align: center;'>Đây là email tự động từ hệ thống OWRMS. Vui lòng không trả lời email này.</p>
</div>";

                            await _emailService.SendInfo(owner.Email, owner.FullName, subject, htmlContent);
                        }

                        _logger.LogInformation("Sent payment notification to user {UserId}", contract.RenterId);
                    }
                }
            }

            return new WebhookCommandResult
            {
                Success = result.Success,
                Message = result.ErrorMessage,
                PaymentCode = result.PaymentCode,
                PaymentId = result.PaymentId
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in ProcessSepayWebhookHandler");
            return new WebhookCommandResult
            {
                Success = false,
                Message = ex.Message
            };
        }
    }
}
