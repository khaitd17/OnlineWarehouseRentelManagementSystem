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
        private readonly INotificationRepository _notificationRepository;
        private readonly INotificationSender _notificationSender;

        public RequestExtensionHandler(
            IContractExtensionRepository extensionRepository,
            IRentalContractRepository contractRepository,
            INotificationRepository notificationRepository,
            INotificationSender notificationSender)
        {
            _extensionRepository = extensionRepository;
            _contractRepository = contractRepository;
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
                        Message = "Original contract not found"
                    };
                }

                // Chỉ có thể extend contract đang ACTIVE hoặc sắp hết hạn
                if (originalContract.Status != RentalContractStatus.Active)
                {
                    return new RequestExtensionResponse
                    {
                        Success = false,
                        Message = $"Cannot extend contract with status: {originalContract.Status}"
                    };
                }

                // Kiểm tra có extension đang pending không
                var hasPendingExtension = await _extensionRepository.HasPendingExtensionAsync(request.OriginalContractId);
                if (hasPendingExtension)
                {
                    return new RequestExtensionResponse
                    {
                        Success = false,
                        Message = "There is already a pending extension request for this contract"
                    };
                }

                // Validate requester
                if (originalContract.RenterId != request.RequesterId)
                {
                    return new RequestExtensionResponse
                    {
                        Success = false,
                        Message = "Only the contract renter can request extension"
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

                // Gửi thông báo cho warehouse owner/staff
                var notification = new Notification
                {
                    UserId = 0, // TODO: Get warehouse owner/admin từ contract.WarehouseId
                    Title = "Contract Extension Request",
                    Message = $"New extension request for contract {originalContract.ContractNumber}. Duration: {request.DurationMonths} months.",
                    Type = "contract_extension_request",
                    CreatedAt = DateTime.UtcNow
                };

                await _notificationRepository.AddAsync(notification);
                // TODO: Send to warehouse owner/staff thay vì userId = 0

                return new RequestExtensionResponse
                {
                    Success = true,
                    Message = "Contract extension request submitted successfully",
                    ExtensionId = savedExtension.ExtensionId,
                    Status = savedExtension.Status,
                    NextSteps = "Your extension request has been submitted and is pending review by the warehouse owner/staff."
                };
            }
            catch (Exception ex)
            {
                return new RequestExtensionResponse
                {
                    Success = false,
                    Message = $"Error submitting extension request: {ex.Message}"
                };
            }
        }
    }
}