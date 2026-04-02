using MediatR;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;
using WMS.Application.Interfaces;

namespace WMS.Application.Features.Contracts.ApproveTermination
{
    public class ApproveTerminationHandler : IRequestHandler<ApproveTerminationCommand, ApproveTerminationResponse>
    {
        private readonly IRentalContractRepository _contractRepository;
        private readonly IWarehouseRepository _warehouseRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly INotificationSender _notificationSender;

        public ApproveTerminationHandler(
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

        public async Task<ApproveTerminationResponse> Handle(ApproveTerminationCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var contract = await _contractRepository.GetByIdAsync(request.ContractId);
                if (contract == null)
                {
                    return new ApproveTerminationResponse
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
                    return new ApproveTerminationResponse
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
                    return new ApproveTerminationResponse
                    {
                        Success = false,
                        Message = "You are not authorized to approve termination for this contract",
                        ContractId = request.ContractId
                    };
                }

                var approvedBy = isRenter ? "RENTER" : "OWNER";

                // Check status
                if (contract.Status != RentalContractStatus.PendingTermination && 
                    contract.Status != RentalContractStatus.PendingClose)
                {
                    return new ApproveTerminationResponse
                    {
                        Success = false,
                        Message = $"Contract is not pending termination/close. Status: {contract.Status}",
                        ContractId = request.ContractId
                    };
                }

                // Remember the original status to determine notification type
                bool isPendingClose = contract.Status == RentalContractStatus.PendingClose;

                // Use direct DB update to bypass reflection issues
                await _contractRepository.ApproveTerminationAsync(request.ContractId, approvedBy);
                
                // Re-fetch to get updated status
                contract = await _contractRepository.GetByIdAsync(request.ContractId);
                if (contract == null)
                {
                    return new ApproveTerminationResponse
                    {
                        Success = false,
                        Message = "Contract not found after update",
                        ContractId = request.ContractId
                    };
                }

                bool isFullyApproved = contract.Status == RentalContractStatus.Terminated || 
                                       contract.Status == RentalContractStatus.Closed;

                // Notify the other party
                int notifyUserId = isRenter ? warehouse.OwnerId : contract.RenterId;
                var approverType = isRenter ? "Người thuê" : "Chủ kho";
                var actionType = isPendingClose ? "kết thúc" : "kết thúc sớm";

                var notification = new WMS.Domain.Entities.Notification
                {
                    UserId = notifyUserId,
                    Title = isFullyApproved 
                        ? $"Hợp đồng đã được {actionType}" 
                        : $"Đã chấp nhận yêu cầu {actionType}",
                    Message = isFullyApproved
                        ? $"Hợp đồng {contract.ContractNumber} đã được cả hai bên đồng ý {actionType}."
                        : $"{approverType} đã chấp nhận yêu cầu {actionType} hợp đồng {contract.ContractNumber}.",
                    Type = isFullyApproved ? "contract_terminated" : "termination_approved",
                    ReferenceType = "Contract",
                    ReferenceId = contract.ContractId,
                    CreatedAt = DateTime.UtcNow
                };

                await _notificationRepository.AddAsync(notification);
                await _notificationSender.SendToUserAsync(notifyUserId, notification);

                return new ApproveTerminationResponse
                {
                    Success = true,
                    Message = isFullyApproved 
                        ? $"Hợp đồng đã được {actionType} thành công." 
                        : "Bạn đã chấp nhận yêu cầu. Đang chờ bên còn lại xác nhận.",
                    ContractId = request.ContractId,
                    Status = contract.Status.ToString(),
                    IsFullyApproved = isFullyApproved
                };
            }
            catch (Exception ex)
            {
                return new ApproveTerminationResponse
                {
                    Success = false,
                    Message = $"Error approving termination: {ex.Message}",
                    ContractId = request.ContractId
                };
            }
        }
    }
}
