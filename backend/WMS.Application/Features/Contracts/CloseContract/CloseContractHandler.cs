using MediatR;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;
using WMS.Application.Interfaces;

namespace WMS.Application.Features.Contracts.CloseContract
{
    public class CloseContractHandler : IRequestHandler<CloseContractCommand, CloseContractResponse>
    {
        private readonly IRentalContractRepository _contractRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly INotificationSender _notificationSender;

        public CloseContractHandler(
            IRentalContractRepository contractRepository,
            INotificationRepository notificationRepository,
            INotificationSender notificationSender)
        {
            _contractRepository = contractRepository;
            _notificationRepository = notificationRepository;
            _notificationSender = notificationSender;
        }

        public async Task<CloseContractResponse> Handle(CloseContractCommand request, CancellationToken cancellationToken)
        {
            try
            {
                // Lấy contract
                var contract = await _contractRepository.GetByIdAsync(request.ContractId);
                if (contract == null)
                {
                    return new CloseContractResponse
                    {
                        Success = false,
                        Message = "Contract not found",
                        ContractId = request.ContractId
                    };
                }

                // Chỉ có thể close khi contract đang COMPLETED
                if (contract.Status != RentalContractStatus.Completed)
                {
                    return new CloseContractResponse
                    {
                        Success = false,
                        Message = $"Cannot close contract with status: {contract.Status}. Contract must be COMPLETED first.",
                        ContractId = request.ContractId
                    };
                }

                // Close contract với domain method
                contract.Close(request.DamageCompensation);

                await _contractRepository.UpdateAsync(contract);

                // Gửi thông báo
                var notification = new WMS.Domain.Entities.Notification
                {
                    UserId = contract.RenterId,
                    Title = "Contract Closed",
                    Message = $"Your rental contract {contract.ContractNumber} has been officially closed. Thank you for using our service!",
                    Type = "contract_closed",
                    CreatedAt = DateTime.UtcNow
                };

                if (request.DamageCompensation.HasValue && request.DamageCompensation.Value > 0)
                {
                    notification.Message += $" Damage compensation: {request.DamageCompensation.Value:C}";
                }

                await _notificationRepository.AddAsync(notification);
                await _notificationSender.SendToUserAsync(contract.RenterId, notification);

                return new CloseContractResponse
                {
                    Success = true,
                    Message = "Contract closed successfully",
                    ContractId = request.ContractId,
                    Status = contract.Status,
                    ClosedAt = DateTime.UtcNow,
                    DamageCompensation = request.DamageCompensation
                };
            }
            catch (Exception ex)
            {
                return new CloseContractResponse
                {
                    Success = false,
                    Message = $"Error closing contract: {ex.Message}",
                    ContractId = request.ContractId
                };
            }
        }
    }
}