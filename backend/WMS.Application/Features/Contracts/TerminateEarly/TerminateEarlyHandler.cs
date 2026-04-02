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

                // Request termination (2-party approval flow)
                contract.RequestTerminationEarly(requestedBy, request.TerminationReason, request.EarlyTerminationFee);

                await _contractRepository.UpdateAsync(contract);

                // Determine the other party to notify
                int notifyUserId = isRenter ? warehouse.OwnerId : contract.RenterId;
                var requesterType = isRenter ? "Người thuê" : "Chủ kho";

                // Gửi thông báo cho bên còn lại
                var notification = new WMS.Domain.Entities.Notification
                {
                    UserId = notifyUserId,
                    Title = "Yêu cầu kết thúc hợp đồng sớm",
                    Message = $"{requesterType} yêu cầu kết thúc sớm hợp đồng {contract.ContractNumber}. Lý do: {request.TerminationReason}. Phí kết thúc sớm: {request.EarlyTerminationFee:N0}đ. Vui lòng xác nhận hoặc từ chối.",
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
                    Message = "Yêu cầu kết thúc sớm đã được gửi. Đang chờ bên còn lại xác nhận.",
                    ContractId = request.ContractId,
                    Status = contract.Status,
                    EarlyTerminationFee = request.EarlyTerminationFee,
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