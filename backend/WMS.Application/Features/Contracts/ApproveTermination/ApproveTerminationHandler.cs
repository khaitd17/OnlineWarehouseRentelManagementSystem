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
        private readonly IRenterAssetRepository _assetRepo;
        private readonly IRentalRequestRepository _rentalRequestRepository;

        public ApproveTerminationHandler(
            IRentalContractRepository contractRepository,
            IWarehouseRepository warehouseRepository,
            INotificationRepository notificationRepository,
            INotificationSender notificationSender,
            IRenterAssetRepository assetRepo,
            IRentalRequestRepository rentalRequestRepository)
        {
            _contractRepository = contractRepository;
            _warehouseRepository = warehouseRepository;
            _notificationRepository = notificationRepository;
            _notificationSender = notificationSender;
            _assetRepo = assetRepo;
            _rentalRequestRepository = rentalRequestRepository;
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

                // In renter-initiated early termination, renter must wait for owner review first.
                if (contract.Status == RentalContractStatus.PendingTermination &&
                    contract.TerminationRequestedBy == "RENTER" &&
                    isRenter &&
                    !contract.OwnerApprovedTermination)
                {
                    return new ApproveTerminationResponse
                    {
                        Success = false,
                        Message = "Yêu cầu cần được chủ kho duyệt trước khi bạn xác nhận.",
                        ContractId = request.ContractId,
                        Status = contract.Status,
                        IsFullyApproved = false,
                        EarlyTerminationFee = contract.EarlyTerminationFee,
                        RequiresPayment = false,
                        PaymentAmount = 0
                    };
                }

                // Approve termination with optional fee (only owner can set fee)
                await _contractRepository.ApproveTerminationAsync(
                    request.ContractId,
                    approvedBy,
                    isOwner ? request.EarlyTerminationFee : null);
                
                // Re-fetch to get updated status
                var updatedContract = await _contractRepository.GetByIdAsync(request.ContractId);
                if (updatedContract == null)
                {
                    return new ApproveTerminationResponse
                    {
                        Success = false,
                        Message = "Contract not found after update",
                        ContractId = request.ContractId
                    };
                }

                bool bothApproved = updatedContract.RenterApprovedTermination && updatedContract.OwnerApprovedTermination;
                bool hasPositiveTerminationFee = (updatedContract.EarlyTerminationFee ?? 0) > 0;
                bool requiresPayment = updatedContract.Status == RentalContractStatus.PendingTermination &&
                                       bothApproved &&
                                       hasPositiveTerminationFee;
                bool isFullyApproved = updatedContract.Status == RentalContractStatus.Terminated ||
                                       updatedContract.Status == RentalContractStatus.Closed;

                // Xóa tồn kho khi cả hai bên đã đồng ý chấm dứt hợp đồng
                if (isFullyApproved)
                {
                    try
                    {
                        await _assetRepo.ClearRenterInventoryAsync(
                            updatedContract.RenterId, updatedContract.WarehouseId, cancellationToken);
                    }
                    catch { /* không chặn luồng */ }

                    // Revert available area for the warehouse
                    var rentalRequest = await _rentalRequestRepository.GetByIdAsync(updatedContract.RentalRequestId);
                    if (rentalRequest != null)
                    {
                        warehouse.AvailableArea += rentalRequest.RequestedArea;
                        if (warehouse.AvailableArea > warehouse.TotalArea)
                        {
                            warehouse.AvailableArea = warehouse.TotalArea; // Ensure it doesn't exceed total
                        }
                        await _warehouseRepository.UpdateAsync(warehouse, cancellationToken);
                    }
                }

                // Notify the other party
                int notifyUserId = isRenter ? warehouse.OwnerId : updatedContract.RenterId;
                var approverType = isRenter ? "Người thuê" : "Chủ kho";
                var actionType = isPendingClose ? "kết thúc" : "kết thúc sớm";

                string feeMessage = updatedContract.EarlyTerminationFee.HasValue
                    ? $" Phí kết thúc sớm: {updatedContract.EarlyTerminationFee:N0}đ."
                    : "";

                string notificationTitle;
                string notificationMessage;
                string notificationType;

                if (isFullyApproved)
                {
                    notificationTitle = $"Hợp đồng đã được {actionType}";
                    notificationMessage = $"Hợp đồng {updatedContract.ContractNumber} đã được cả hai bên đồng ý {actionType}.{feeMessage}";
                    notificationType = "contract_terminated";
                }
                else if (requiresPayment)
                {
                    notificationTitle = "Đã xác nhận kết thúc sớm, chờ thanh toán";
                    notificationMessage = $"{approverType} đã xác nhận kết thúc sớm hợp đồng {updatedContract.ContractNumber}.{feeMessage} Đang chờ người thuê thanh toán để hoàn tất.";
                    notificationType = "termination_approved";
                }
                else
                {
                    notificationTitle = $"Đã chấp nhận yêu cầu {actionType}";
                    notificationMessage = $"{approverType} đã chấp nhận yêu cầu {actionType} hợp đồng {updatedContract.ContractNumber}.{feeMessage}";
                    notificationType = "termination_approved";
                }

                var notification = new WMS.Domain.Entities.Notification
                {
                    UserId = notifyUserId,
                    Title = notificationTitle,
                    Message = notificationMessage,
                    Type = notificationType,
                    ReferenceType = "Contract",
                    ReferenceId = updatedContract.ContractId,
                    CreatedAt = DateTime.UtcNow
                };

                await _notificationRepository.AddAsync(notification);
                await _notificationSender.SendToUserAsync(notifyUserId, notification);

                var responseMessage = isFullyApproved
                    ? $"Hợp đồng đã được {actionType} thành công."
                    : requiresPayment
                        ? "Hai bên đã xác nhận. Vui lòng thanh toán phí kết thúc sớm để hoàn tất."
                        : "Bạn đã chấp nhận yêu cầu. Đang chờ bên còn lại xác nhận.";

                if (!isOwner && contract.Status == RentalContractStatus.PendingTermination && contract.TerminationRequestedBy == "RENTER" && !requiresPayment && !isFullyApproved)
                {
                    responseMessage = "Bạn đã xác nhận yêu cầu. Đang chờ chủ kho xem xét.";
                }

                return new ApproveTerminationResponse
                {
                    Success = true,
                    Message = responseMessage,
                    ContractId = request.ContractId,
                    Status = updatedContract.Status,
                    IsFullyApproved = isFullyApproved,
                    EarlyTerminationFee = updatedContract.EarlyTerminationFee,
                    RequiresPayment = requiresPayment,
                    PaymentAmount = requiresPayment ? (updatedContract.EarlyTerminationFee ?? 0) : 0
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
