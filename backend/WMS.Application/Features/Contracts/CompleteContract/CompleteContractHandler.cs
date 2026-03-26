using MediatR;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;
using WMS.Application.Interfaces;

namespace WMS.Application.Features.Contracts.CompleteContract
{
    public class CompleteContractHandler : IRequestHandler<CompleteContractCommand, CompleteContractResponse>
    {
        private readonly IRentalContractRepository _contractRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly INotificationSender _notificationSender;

        public CompleteContractHandler(
            IRentalContractRepository contractRepository,
            INotificationRepository notificationRepository,
            INotificationSender notificationSender)
        {
            _contractRepository = contractRepository;
            _notificationRepository = notificationRepository;
            _notificationSender = notificationSender;
        }

        public async Task<CompleteContractResponse> Handle(CompleteContractCommand request, CancellationToken cancellationToken)
        {
            try
            {
                // Lấy contract
                var contract = await _contractRepository.GetByIdAsync(request.ContractId);
                if (contract == null)
                {
                    return new CompleteContractResponse
                    {
                        Success = false,
                        Message = "Contract not found",
                        ContractId = request.ContractId
                    };
                }

                // Chỉ có thể complete khi contract đang ACTIVE
                if (contract.Status != RentalContractStatus.Active)
                {
                    return new CompleteContractResponse
                    {
                        Success = false,
                        Message = $"Cannot complete contract with status: {contract.Status}",
                        ContractId = request.ContractId
                    };
                }

                // Complete contract với domain method
                contract.Complete();

                await _contractRepository.UpdateAsync(contract);

                // Gửi thông báo
                var notification = new WMS.Domain.Entities.Notification
                {
                    UserId = contract.RenterId,
                    Title = "Contract Completed",
                    Message = $"Your rental contract {contract.ContractNumber} has been marked as completed. Please prepare for warehouse return.",
                    Type = "contract_completed",
                    CreatedAt = DateTime.UtcNow
                };

                await _notificationRepository.AddAsync(notification);
                await _notificationSender.SendToUserAsync(contract.RenterId, notification);

                return new CompleteContractResponse
                {
                    Success = true,
                    Message = "Contract completed successfully",
                    ContractId = request.ContractId,
                    Status = contract.Status,
                    CompletedAt = DateTime.UtcNow
                };
            }
            catch (Exception ex)
            {
                return new CompleteContractResponse
                {
                    Success = false,
                    Message = $"Error completing contract: {ex.Message}",
                    ContractId = request.ContractId
                };
            }
        }
    }
}