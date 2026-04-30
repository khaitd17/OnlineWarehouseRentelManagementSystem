using MediatR;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;
using WMS.Domain.Entities;
using WMS.Application.Interfaces;

namespace WMS.Application.Features.ContractExtensions.RequestExtension
{
    public class RequestExtensionHandler : IRequestHandler<RequestExtensionCommand, RequestExtensionResponse>
    {
        private readonly IContractExtensionRepository _extensionRepository;
        private readonly IRentalContractRepository _contractRepository;
        private readonly IWarehouseRepository _warehouseRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly INotificationSender _notificationSender;

        public RequestExtensionHandler(
            IContractExtensionRepository extensionRepository,
            IRentalContractRepository contractRepository,
            IWarehouseRepository warehouseRepository,
            INotificationRepository notificationRepository,
            INotificationSender notificationSender)
        {
            _extensionRepository = extensionRepository;
            _contractRepository = contractRepository;
            _warehouseRepository = warehouseRepository;
            _notificationRepository = notificationRepository;
            _notificationSender = notificationSender;
        }

        public async Task<RequestExtensionResponse> Handle(RequestExtensionCommand request, CancellationToken cancellationToken)
        {
            try
            {
                // Kiểm tra original contract
                var originalContract = await _contractRepository.GetByIdAsync(request.OriginalContractId);
                if (originalContract == null)
                {
                    return new RequestExtensionResponse
                    {
                        Success = false,
                        Message = "Không tìm thấy hợp đồng gốc"
                    };
                }

                // Chỉ có thể extend contract đang ACTIVE hoặc sắp hết hạn
                if (originalContract.Status != RentalContractStatus.Active)
                {
                    return new RequestExtensionResponse
                    {
                        Success = false,
                        Message = $"Không thể gia hạn hợp đồng có trạng thái: {originalContract.Status}"
                    };
                }

                // Kiểm tra có extension đang pending không
                var hasPendingExtension = await _extensionRepository.HasPendingExtensionAsync(request.OriginalContractId);
                if (hasPendingExtension)
                {
                    return new RequestExtensionResponse
                    {
                        Success = false,
                        Message = "Đã có yêu cầu gia hạn cho hợp đồng này"
                    };
                }

                // Validate requester
                if (originalContract.RenterId != request.RequesterId)
                {
                    return new RequestExtensionResponse
                    {
                        Success = false,
                        Message = "Chỉ người thuê mới có thể yêu cầu gia hạn hợp đồng"
                    };
                }

                // Tạo extension request
                var extension = ContractExtension.Create(
                    originalContractId: request.OriginalContractId,
                    requesterId: request.RequesterId,
                    durationMonths: request.DurationMonths,
                    proposedMonthlyPayment: request.ProposedMonthlyPayment,
                    notes: request.Notes);

                var savedExtension = await _extensionRepository.AddAsync(extension);

                // Get warehouse to find owner
                var warehouse = await _warehouseRepository.GetByIdAsync(
                    originalContract.WarehouseId,
                    cancellationToken);

                if (warehouse != null)
                {
                    // Send notification to warehouse owner
                    var notification = new Notification
                    {
                        UserId = warehouse.OwnerId,
                        Title = "Yêu cầu gia hạn hợp đồng mới",
                        Message = $"Người thuê đã gửi yêu cầu gia hạn hợp đồng {originalContract.ContractNumber}. " +
                                  $"Thời hạn gia hạn: {request.DurationMonths} tháng.",
                        Type = "EXTENSION_REQUEST_RECEIVED",
                        ReferenceId = savedExtension.ExtensionId,
                        ReferenceType = "CONTRACT_EXTENSION",
                        CreatedAt = DateTime.UtcNow
                    };

                    try
                    {
                        await _notificationRepository.AddAsync(notification);
                        await _notificationSender.SendToUserAsync(warehouse.OwnerId, notification);
                    }
                    catch
                    {
                        // Keep request success even if realtime/push notification fails.
                    }
                }

                return new RequestExtensionResponse
                {
                    Success = true,
                    Message = "Yêu cầu gia hạn hợp đồng đã được gửi thành công",
                    ExtensionId = savedExtension.ExtensionId,
                    Status = savedExtension.Status,
                    NextSteps = "Yêu cầu gia hạn của bạn đã được gửi và đang chờ chủ kho xem xét."
                };
            }
            catch (Exception ex)
            {
                return new RequestExtensionResponse
                {
                    Success = false,
                    Message = $"Lỗi khi gửi yêu cầu gia hạn: {ex.Message}"
                };
            }
        }
    }
}
