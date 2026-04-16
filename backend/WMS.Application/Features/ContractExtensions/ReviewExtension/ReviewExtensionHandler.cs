using MediatR;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;
using WMS.Domain.Entities;
using WMS.Application.Interfaces;

namespace WMS.Application.Features.ContractExtensions.ReviewExtension
{
    public class ReviewExtensionHandler : IRequestHandler<ReviewExtensionCommand, ReviewExtensionResponse>
    {
        private readonly IContractExtensionRepository _extensionRepository;
        private readonly IRentalContractRepository _contractRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly INotificationSender _notificationSender;
        private readonly IWarehouseRepository _warehouseRepository;

        public ReviewExtensionHandler(
            IContractExtensionRepository extensionRepository,
            IRentalContractRepository contractRepository,
            INotificationRepository notificationRepository,
            INotificationSender notificationSender,
            IWarehouseRepository warehouseRepository)
        {
            _extensionRepository = extensionRepository;
            _contractRepository = contractRepository;
            _notificationRepository = notificationRepository;
            _notificationSender = notificationSender;
            _warehouseRepository = warehouseRepository;
        }

        public async Task<ReviewExtensionResponse> Handle(ReviewExtensionCommand request, CancellationToken cancellationToken)
        {
            try
            {
                // Lấy extension request
                var extension = await _extensionRepository.GetByIdAsync(request.ExtensionId);
                if (extension == null)
                {
                    return new ReviewExtensionResponse
                    {
                        Success = false,
                        Message = "Extension request not found",
                        ExtensionId = request.ExtensionId
                    };
                }

                // Lấy original contract
                var originalContract = await _contractRepository.GetByIdAsync(extension.OriginalContractId);
                if (originalContract == null)
                {
                    return new ReviewExtensionResponse
                    {
                        Success = false,
                        Message = "Original contract not found",
                        ExtensionId = request.ExtensionId
                    };
                }

                // Chỉ OWNER của kho mới được duyệt/từ chối gia hạn hợp đồng
                var warehouse = await _warehouseRepository.GetByIdAsync(originalContract.WarehouseId, cancellationToken);
                if (warehouse == null || warehouse.OwnerId != request.ReviewerId)
                {
                    return new ReviewExtensionResponse
                    {
                        Success = false,
                        Message = "Bạn không có quyền duyệt gia hạn hợp đồng này. Chỉ chủ kho mới được thực hiện.",
                        ExtensionId = request.ExtensionId
                    };
                }

                if (request.Decision.ToUpper() == "APPROVE")
                {
                    var monthlyPayment = request.ApprovedMonthlyPayment ?? extension.ProposedMonthlyPayment ?? originalContract.MonthlyPayment;

                    // Approve extension
                    extension.Approve(request.ReviewerId, monthlyPayment);
                    await _extensionRepository.UpdateAsync(extension);

                    // Gửi thông báo
                    var notification = new Notification
                    {
                        UserId = extension.RequesterId,
                        Title = "Yêu cầu gia hạn đã được duyệt",
                        Message = $"Chủ kho đã duyệt gia hạn hợp đồng. Giá thuê gia hạn: {monthlyPayment:N0}đ/tháng trong {extension.DurationMonths} tháng. Vui lòng xác nhận để tiếp tục thanh toán.",
                        Type = "EXTENSION_APPROVED",
                        ReferenceId = extension.ExtensionId,
                        ReferenceType = "CONTRACT_EXTENSION",
                        CreatedAt = DateTime.UtcNow
                    };

                    try
                    {
                        await _notificationRepository.AddAsync(notification);
                        await _notificationSender.SendToUserAsync(extension.RequesterId, notification);
                    }
                    catch
                    {
                        // Keep approval successful even if notification persistence/realtime fails.
                    }

                    return new ReviewExtensionResponse
                    {
                        Success = true,
                        Message = "Đã duyệt yêu cầu gia hạn và gửi báo giá cho người thuê",
                        ExtensionId = request.ExtensionId,
                        Status = extension.Status,
                        NewContractId = null,
                        NextSteps = "Chờ người thuê xác nhận gia hạn và thanh toán."
                    };
                }
                else if (request.Decision.ToUpper() == "REJECT")
                {
                    if (string.IsNullOrWhiteSpace(request.RejectionReason))
                    {
                        return new ReviewExtensionResponse
                        {
                            Success = false,
                            Message = "Rejection reason is required",
                            ExtensionId = request.ExtensionId
                        };
                    }

                    // Reject extension
                    extension.Reject(request.ReviewerId, request.RejectionReason);
                    await _extensionRepository.UpdateAsync(extension);

                    // Gửi thông báo
                    var notification = new Notification
                    {
                        UserId = extension.RequesterId,
                        Title = "Yêu cầu gia hạn bị từ chối",
                        Message = $"Chủ kho đã từ chối yêu cầu gia hạn. Lý do: {request.RejectionReason}",
                        Type = "EXTENSION_REJECTED",
                        ReferenceId = extension.ExtensionId,
                        ReferenceType = "CONTRACT_EXTENSION",
                        CreatedAt = DateTime.UtcNow
                    };

                    try
                    {
                        await _notificationRepository.AddAsync(notification);
                        await _notificationSender.SendToUserAsync(extension.RequesterId, notification);
                    }
                    catch
                    {
                        // Keep rejection successful even if notification persistence/realtime fails.
                    }

                    return new ReviewExtensionResponse
                    {
                        Success = true,
                        Message = "Đã từ chối yêu cầu gia hạn",
                        ExtensionId = request.ExtensionId,
                        Status = extension.Status,
                        NextSteps = "Người thuê đã được thông báo."
                    };
                }
                else
                {
                    return new ReviewExtensionResponse
                    {
                        Success = false,
                        Message = "Invalid decision. Must be 'APPROVE' or 'REJECT'",
                        ExtensionId = request.ExtensionId
                    };
                }
            }
            catch (Exception ex)
            {
                return new ReviewExtensionResponse
                {
                    Success = false,
                    Message = $"Error reviewing extension: {ex.Message}",
                    ExtensionId = request.ExtensionId
                };
            }
        }
    }
}
