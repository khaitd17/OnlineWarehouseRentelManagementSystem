using MediatR;
using Microsoft.Extensions.Logging;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Subscriptions.Commands;

public class CreateSubscriptionHandler : IRequestHandler<CreateSubscriptionCommand, CreateSubscriptionResult>
{
    private readonly ISubscriptionRepository _subscriptionRepo;
    private readonly ISepayService _sepayService;
    private readonly ILogger<CreateSubscriptionHandler> _logger;

    private readonly ISubscriptionPackageRepository _packageRepo;
    public CreateSubscriptionHandler(ISubscriptionRepository subscriptionRepo, ISepayService sepayService, ILogger<CreateSubscriptionHandler> logger, ISubscriptionPackageRepository packageRepo)
    {
        _subscriptionRepo = subscriptionRepo;
        _sepayService = sepayService;
        _logger = logger;
        _packageRepo = packageRepo;
    }

    public async Task<CreateSubscriptionResult> Handle(CreateSubscriptionCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Kiểm tra user có đang dùng gói còn hiệu lực không
            var activeSub = await _subscriptionRepo.GetActiveByUserAsync(request.UserId);
            if (activeSub != null)
            {
                var expiryStr = activeSub.EndDate.HasValue
                    ? activeSub.EndDate.Value.ToLocalTime().ToString("dd/MM/yyyy")
                    : "không xác định";
                return new CreateSubscriptionResult
                {
                    Success = false,
                    Message = $"Bạn đang sử dụng gói {activeSub.Plan}, hết hạn ngày {expiryStr}. " +
                              $"Vui lòng chờ hết hạn để mua gói mới."
                };
            }

            var package = await _packageRepo.GetByNameAsync(request.Plan);
            if (package == null)
            {
                return new CreateSubscriptionResult
                {
                    Success = false,
                    Message = $"Gói cước {request.Plan} không tồn tại."
                };
            }
            decimal amount = package.Price;

            // Hủy tất cả Pending cũ (tránh rác DB khi user bấm nhiều lần trước đây)
            await _subscriptionRepo.CancelAllPendingAsync(request.UserId);

            // Generate unique transaction reference SUB + 6 digits
            var random = new Random();
            string transactionCode = $"SUB{random.Next(100000, 999999)}";
            
            // Ensure uniqueness
            while (await _subscriptionRepo.ExistsPendingTransactionAsync(transactionCode))
            {
                transactionCode = $"SUB{random.Next(100000, 999999)}";
            }

            var subscription = new Subscription
            {
                UserId = request.UserId,
                Plan = request.Plan,
                Status = SubscriptionStatus.Pending,
                TransactionReference = transactionCode
            };

            await _subscriptionRepo.AddAsync(subscription);

            var qrInfo = _sepayService.GenerateQrInfo(transactionCode, amount, $"Đăng ký gói {request.Plan}");

            return new CreateSubscriptionResult
            {
                Success = true,
                Message = "Tạo yêu cầu thanh toán thành công",
                PaymentInfo = qrInfo
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating subscription");
            return new CreateSubscriptionResult
            {
                Success = false,
                Message = ex.Message
            };
        }
    }
}
