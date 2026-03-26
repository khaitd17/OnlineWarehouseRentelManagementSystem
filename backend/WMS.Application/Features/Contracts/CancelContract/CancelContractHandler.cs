using MediatR;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;
using WMS.Application.Interfaces;

namespace WMS.Application.Features.Contracts.CancelContract
{
    public class CancelContractHandler : IRequestHandler<CancelContractCommand, CancelContractResponse>
    {
        private readonly IRentalContractRepository _contractRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly INotificationSender _notificationSender;

        public CancelContractHandler(
            IRentalContractRepository contractRepository,
            INotificationRepository notificationRepository,
            INotificationSender notificationSender)
        {
            _contractRepository = contractRepository;
            _notificationRepository = notificationRepository;
            _notificationSender = notificationSender;
        }

        public async Task<CancelContractResponse> Handle(CancelContractCommand request, CancellationToken cancellationToken)
        {
            try
            {
                // Lấy contract
                var contract = await _contractRepository.GetByIdAsync(request.ContractId);
                if (contract == null)
                {
                    return new CancelContractResponse
                    {
                        Success = false,
                        Message = "Contract not found",
                        ContractId = request.ContractId
                    };
                }

                // Kiểm tra quyền cancel
                var canCancel = contract.Status == RentalContractStatus.Draft ||
                               contract.Status == RentalContractStatus.PendingOwnerSignature ||
                               contract.Status == RentalContractStatus.PendingSignature ||
                               contract.Status == RentalContractStatus.Signed ||
                               contract.Status == RentalContractStatus.PendingPayment;

                if (!canCancel)
                {
                    return new CancelContractResponse
                    {
                        Success = false,
                        Message = $"Cannot cancel contract with status: {contract.Status}",
                        ContractId = request.ContractId
                    };
                }

                // Cancel contract
                contract.Cancel(request.CancellationReason);

                await _contractRepository.UpdateAsync(contract);

                // Gửi thông báo
                var notification = new WMS.Domain.Entities.Notification
                {
                    UserId = contract.RenterId,
                    Title = "Contract Cancelled",
                    Message = $"Your rental contract {contract.ContractNumber} has been cancelled. Reason: {request.CancellationReason}",
                    Type = "contract_cancelled",
                    CreatedAt = DateTime.UtcNow
                };

                await _notificationRepository.AddAsync(notification);
                await _notificationSender.SendToUserAsync(contract.RenterId, notification);

                return new CancelContractResponse
                {
                    Success = true,
                    Message = "Contract cancelled successfully",
                    ContractId = request.ContractId,
                    Status = contract.Status
                };
            }
            catch (Exception ex)
            {
                return new CancelContractResponse
                {
                    Success = false,
                    Message = $"Error cancelling contract: {ex.Message}",
                    ContractId = request.ContractId
                };
            }
        }
    }
}