using MediatR;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;
using WMS.Application.Interfaces;

namespace WMS.Application.Features.Contracts.TerminateEarly
{
    public class TerminateEarlyHandler : IRequestHandler<TerminateEarlyCommand, TerminateEarlyResponse>
    {
        private readonly IRentalContractRepository _contractRepository;
        private readonly IWarehouseRepository _warehouseRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly INotificationSender _notificationSender;

        public TerminateEarlyHandler(
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

        public async Task<TerminateEarlyResponse> Handle(TerminateEarlyCommand request, CancellationToken cancellationToken)
        {
            try
            {
                // Lấy contract
                var contract = await _contractRepository.GetByIdAsync(request.ContractId);
                if (contract == null)
                {
                    return new TerminateEarlyResponse
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
                    return new TerminateEarlyResponse
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
                    return new TerminateEarlyResponse
                    {
                        Success = false,
                        Message = "You are not authorized to terminate this contract",
                        ContractId = request.ContractId
                    };
                }

                var requestedBy = isRenter ? "RENTER" : "OWNER";

                // Chỉ có thể request termination khi contract đang ACTIVE
                if (contract.Status != RentalContractStatus.Active)
                {
                    return new TerminateEarlyResponse
                    {
                        Success = false,
                        Message = $"Cannot terminate contract with status: {contract.Status}",
                        ContractId = request.ContractId
                    };
                }

                // Request termination using direct DB update (ensure status is set correctly)
                // This is more reliable than UpdateAsync which uses reflection
                await _contractRepository.RequestTerminationAsync(request.ContractId, requestedBy, request.TerminationReason, fee: null);

                // Determine the other party to notify
                int notifyUserId = isRenter ? warehouse.OwnerId : contract.RenterId;
                var requesterType = isRenter ? "Người thuê" : "Chủ kho";

                // Gửi thông báo cho chủ kho để review
                var notifyMessage = isRenter 
                    ? $"Người thuê yêu cầu kết thúc sớm hợp đồng {contract.ContractNumber}. Lý do: {request.TerminationReason}. Vui lòng xác nhận hoặc từ chối."
                    : $"Chủ kho yêu cầu kết thúc sớm hợp đồng {contract.ContractNumber}. Lý do: {request.TerminationReason}. Vui lòng xác nhận hoặc từ chối.";

                var notification = new WMS.Domain.Entities.Notification
                {
                    UserId = notifyUserId,
                    Title = "Yêu cầu kết thúc hợp đồng sớm",
                    Message = notifyMessage,
                    Type = "termination_request",
                    ReferenceType = "Contract",
                    ReferenceId = contract.ContractId,
                    CreatedAt = DateTime.UtcNow
                };

                await _notificationRepository.AddAsync(notification);
                await _notificationSender.SendToUserAsync(notifyUserId, notification);

                return new TerminateEarlyResponse
                {
                    Success = true,
                    Message = isRenter
                        ? "Yêu cầu kết thúc sớm đã được gửi. Đang chờ chủ kho duyệt mức phí."
                        : "Yêu cầu kết thúc sớm đã được gửi. Đang chờ người thuê xác nhận.",
                    ContractId = request.ContractId,
                    Status = RentalContractStatus.PendingTermination,
                    PendingApproval = true
                };
            }
            catch (Exception ex)
            {
                return new TerminateEarlyResponse
                {
                    Success = false,
                    Message = $"Error terminating contract: {ex.Message}",
                    ContractId = request.ContractId
                };
            }
        }
    }
}