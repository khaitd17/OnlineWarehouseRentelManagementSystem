using MediatR;
using Microsoft.Extensions.Logging;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
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

    public ProcessSepayWebhookHandler(
        ISepayService sepayService,
        IRentalPaymentRepository paymentRepo,
        IRentalContractRepository contractRepo,
        INotificationRepository notificationRepo,
        INotificationSender notificationSender,
        ISubscriptionRepository subscriptionRepo,
        ILogger<ProcessSepayWebhookHandler> logger)
    {
        _sepayService = sepayService;
        _paymentRepo = paymentRepo;
        _contractRepo = contractRepo;
        _notificationRepo = notificationRepo;
        _notificationSender = notificationSender;
        _subscriptionRepo = subscriptionRepo;
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

                    if (payment != null && payment.Contract != null)
                    {
                        // Send notification to renter
                        var notification = new Notification
                        {
                            UserId = payment.Contract.RenterId,
                            Title = "Thanh toán thành công",
                            Message = $"Thanh toán {result.PaymentCode} đã được xác nhận. Hợp đồng {payment.Contract.ContractNumber} đã được kích hoạt.",
                            Type = "PAYMENT_COMPLETED",
                            ReferenceId = payment.ContractId,
                            ReferenceType = "CONTRACT",
                            CreatedAt = DateTime.UtcNow
                        };

                        await _notificationRepo.AddAsync(notification);
                        await _notificationSender.SendToUserAsync(payment.Contract.RenterId, notification);

                        _logger.LogInformation("Sent payment notification to user {UserId}", payment.Contract.RenterId);
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
