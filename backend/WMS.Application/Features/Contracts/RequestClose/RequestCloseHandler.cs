using MediatR;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;
using WMS.Application.Interfaces;

namespace WMS.Application.Features.Contracts.RequestClose
{
    public class RequestCloseHandler : IRequestHandler<RequestCloseCommand, RequestCloseResponse>
    {
        private readonly IRentalContractRepository _contractRepository;
        private readonly IWarehouseRepository _warehouseRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly INotificationSender _notificationSender;

        public RequestCloseHandler(
            IRentalContractRepository contractRepository,
            IWarehouseRepository warehouseRepository,
            INotificationRepository notificationRepository,
            INotificationSender notificationSender)
        {
            _contractRepository = contractRepository;
            _warehouseRepository = warehouseRepository;
            _notificationRepository = notificationRepository;
            _notificationSender = notificationSender;
        }

        public async Task<RequestCloseResponse> Handle(RequestCloseCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var contract = await _contractRepository.GetByIdAsync(request.ContractId);
                if (contract == null)
                {
                    return new RequestCloseResponse
                    {
                        Success = false,
                        Message = "Contract not found",
                        ContractId = request.ContractId
                    };
                }

                // Get warehouse to determine owner
                var warehouse = await _warehouseRepository.GetByIdAsync(contract.WarehouseId, cancellationToken);
                if (warehouse == null)
                {
                    return new RequestCloseResponse
                    {
                        Success = false,
                        Message = "Warehouse not found",
                        ContractId = request.ContractId
                    };
                }

                // Determine if user is renter or owner
                var isRenter = contract.RenterId == request.UserId;
                var isOwner = warehouse.OwnerId == request.UserId;
                
                if (!isRenter && !isOwner)
                {
                    return new RequestCloseResponse
                    {
                        Success = false,
                        Message = "You are not authorized to request close for this contract",
                        ContractId = request.ContractId
                    };
                }

                var requestedBy = isRenter ? "RENTER" : "OWNER";

                // Chỉ có thể request close khi contract đang ACTIVE
                if (contract.Status != RentalContractStatus.Active)
                {
                    return new RequestCloseResponse
                    {
                        Success = false,
                        Message = $"Cannot request close for contract with status: {contract.Status}",
                        ContractId = request.ContractId
                    };
                }

                // Request close - use direct DB update to bypass reflection issues
                await _contractRepository.RequestCloseAsync(request.ContractId, requestedBy);

                // Notify the other party
                int notifyUserId = isRenter ? warehouse.OwnerId : contract.RenterId;
                var requesterType = isRenter ? "Người thuê" : "Chủ kho";

                var notification = new WMS.Domain.Entities.Notification
                {
                    UserId = notifyUserId,
                    Title = "Yêu cầu kết thúc hợp đồng",
                    Message = $"{requesterType} yêu cầu kết thúc hợp đồng {contract.ContractNumber}. Vui lòng xác nhận hoặc từ chối.",
                    Type = "close_request",
                    ReferenceType = "Contract",
                    ReferenceId = contract.ContractId,
                    CreatedAt = DateTime.UtcNow
                };

                await _notificationRepository.AddAsync(notification);
                await _notificationSender.SendToUserAsync(notifyUserId, notification);

                return new RequestCloseResponse
                {
                    Success = true,
                    Message = "Yêu cầu kết thúc hợp đồng đã được gửi. Đang chờ bên còn lại xác nhận.",
                    ContractId = request.ContractId,
                    Status = "PENDING_CLOSE"
                };
            }
            catch (Exception ex)
            {
                return new RequestCloseResponse
                {
                    Success = false,
                    Message = $"Error requesting close: {ex.Message}",
                    ContractId = request.ContractId
                };
            }
        }
    }
}
