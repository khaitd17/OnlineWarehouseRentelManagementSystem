using MediatR;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;
using WMS.Application.Interfaces;

namespace WMS.Application.Features.Contracts.TerminateEarly
{
    public class TerminateEarlyHandler : IRequestHandler<TerminateEarlyCommand, TerminateEarlyResponse>
    {
        private readonly IRentalContractRepository _contractRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly INotificationSender _notificationSender;

        public TerminateEarlyHandler(
            IRentalContractRepository contractRepository,
            INotificationRepository notificationRepository,
            INotificationSender notificationSender)
        {
            _contractRepository = contractRepository;
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

                // Chỉ có thể terminate early khi contract đang ACTIVE
                if (contract.Status != RentalContractStatus.Active)
                {
                    return new TerminateEarlyResponse
                    {
                        Success = false,
                        Message = $"Cannot terminate contract with status: {contract.Status}",
                        ContractId = request.ContractId
                    };
                }

                // Terminate early với domain method
                contract.TerminateEarly(request.TerminationReason, request.EarlyTerminationFee);

                await _contractRepository.UpdateAsync(contract);

                // Gửi thông báo
                var notification = new WMS.Domain.Entities.Notification
                {
                    UserId = contract.RenterId,
                    Title = "Contract Terminated Early",
                    Message = $"Your rental contract {contract.ContractNumber} has been terminated early. Fee: {request.EarlyTerminationFee:C}. Reason: {request.TerminationReason}",
                    Type = "contract_terminated",
                    CreatedAt = DateTime.UtcNow
                };

                await _notificationRepository.AddAsync(notification);
                await _notificationSender.SendToUserAsync(contract.RenterId, notification);

                return new TerminateEarlyResponse
                {
                    Success = true,
                    Message = "Contract terminated early successfully",
                    ContractId = request.ContractId,
                    Status = contract.Status,
                    EarlyTerminationFee = request.EarlyTerminationFee
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