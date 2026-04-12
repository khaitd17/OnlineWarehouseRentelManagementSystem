using MediatR;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;
using WMS.Application.Interfaces;

namespace WMS.Application.Features.Contracts.RejectTermination
{
    public class RejectTerminationHandler : IRequestHandler<RejectTerminationCommand, RejectTerminationResponse>
    {
        private readonly IRentalContractRepository _contractRepository;
        private readonly IWarehouseRepository _warehouseRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly INotificationSender _notificationSender;

        public RejectTerminationHandler(
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

        public async Task<RejectTerminationResponse> Handle(RejectTerminationCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var contract = await _contractRepository.GetByIdAsync(request.ContractId);
                if (contract == null)
                {
                    return new RejectTerminationResponse
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
                    return new RejectTerminationResponse
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
                    return new RejectTerminationResponse
                    {
                        Success = false,
                        Message = "You are not authorized to reject termination for this contract",
                        ContractId = request.ContractId
                    };
                }

                var rejectedBy = isRenter ? "RENTER" : "OWNER";

                // Check status
                if (contract.Status != RentalContractStatus.PendingTermination && 
                    contract.Status != RentalContractStatus.PendingClose)
                {
                    return new RejectTerminationResponse
                    {
                        Success = false,
                        Message = $"Contract is not pending termination/close. Status: {contract.Status}",
                        ContractId = request.ContractId
                    };
                }

                bool isPendingClose = contract.Status == RentalContractStatus.PendingClose;
                
                // Use direct DB update to bypass reflection issues
                await _contractRepository.RejectTerminationAsync(request.ContractId);

                // Re-load to get final status after rejection rollback
                var updatedContract = await _contractRepository.GetByIdAsync(request.ContractId) ?? contract;

                // Notify the opposite party (counterparty in this negotiation step).
                int notifyUserId = isRenter ? warehouse.OwnerId : contract.RenterId;

                var rejecterType = isRenter ? "Người thuê" : "Chủ kho";
                var actionType = isPendingClose ? "kết thúc" : "kết thúc sớm";

                var notification = new WMS.Domain.Entities.Notification
                {
                    UserId = notifyUserId,
                    Title = $"Yêu cầu {actionType} bị từ chối",
                    Message = $"{rejecterType} đã từ chối yêu cầu {actionType} hợp đồng {contract.ContractNumber}." + 
                              (string.IsNullOrEmpty(request.RejectReason) ? "" : $" Lý do: {request.RejectReason}"),
                    Type = "termination_rejected",
                    ReferenceType = "Contract",
                    ReferenceId = contract.ContractId,
                    CreatedAt = DateTime.UtcNow
                };

                await _notificationRepository.AddAsync(notification);
                await _notificationSender.SendToUserAsync(notifyUserId, notification);

                return new RejectTerminationResponse
                {
                    Success = true,
                    Message = $"Bạn đã từ chối yêu cầu {actionType}. Hợp đồng tiếp tục có hiệu lực.",
                    ContractId = request.ContractId,
                    Status = updatedContract.Status
                };
            }
            catch (Exception ex)
            {
                return new RejectTerminationResponse
                {
                    Success = false,
                    Message = $"Error rejecting termination: {ex.Message}",
                    ContractId = request.ContractId
                };
            }
        }
    }
}
