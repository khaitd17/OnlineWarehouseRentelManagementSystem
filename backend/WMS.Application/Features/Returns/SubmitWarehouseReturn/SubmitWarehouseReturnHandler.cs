using MediatR;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;
using WMS.Domain.Entities;
using WMS.Application.Interfaces;

namespace WMS.Application.Features.Returns.SubmitWarehouseReturn
{
    public class SubmitWarehouseReturnHandler : IRequestHandler<SubmitWarehouseReturnCommand, SubmitWarehouseReturnResponse>
    {
        private readonly IWarehouseReturnRepository _returnRepository;
        private readonly IRentalContractRepository _contractRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly INotificationSender _notificationSender;

        public SubmitWarehouseReturnHandler(
            IWarehouseReturnRepository returnRepository,
            IRentalContractRepository contractRepository,
            INotificationRepository notificationRepository,
            INotificationSender notificationSender)
        {
            _returnRepository = returnRepository;
            _contractRepository = contractRepository;
            _notificationRepository = notificationRepository;
            _notificationSender = notificationSender;
        }

        public async Task<SubmitWarehouseReturnResponse> Handle(SubmitWarehouseReturnCommand request, CancellationToken cancellationToken)
        {
            try
            {
                // Kiểm tra contract
                var contract = await _contractRepository.GetByIdAsync(request.ContractId);
                if (contract == null)
                {
                    return new SubmitWarehouseReturnResponse
                    {
                        Success = false,
                        Message = "Contract not found"
                    };
                }

                // Chỉ contract COMPLETED mới được return
                if (contract.Status != RentalContractStatus.Completed)
                {
                    return new SubmitWarehouseReturnResponse
                    {
                        Success = false,
                        Message = $"Cannot create return for contract with status: {contract.Status}"
                    };
                }

                // Kiểm tra xem đã có return chưa
                var existingReturn = await _returnRepository.ExistsByContractIdAsync(request.ContractId);
                if (existingReturn)
                {
                    return new SubmitWarehouseReturnResponse
                    {
                        Success = false,
                        Message = "Warehouse return already exists for this contract"
                    };
                }

                // Tạo warehouse return
                var warehouseReturn = WarehouseReturn.CreateForContract(
                    contractId: request.ContractId,
                    isClean: request.IsClean,
                    isEquipmentIntact: request.IsEquipmentIntact,
                    isNoOutstandingDebt: request.IsNoOutstandingDebt,
                    notes: request.Notes);

                // Add images
                foreach (var imageDto in request.Images)
                {
                    warehouseReturn.AddImage(imageDto.ImageUrl, imageDto.Description);
                }

                var returnId = await _returnRepository.AddAsync(warehouseReturn);

                // Xác định có cần inspection không
                var requiresInspection = !request.IsClean || !request.IsEquipmentIntact || !request.IsNoOutstandingDebt;

                string status = requiresInspection ? "PENDING_INSPECTION" : "APPROVED";
                string nextSteps = requiresInspection
                    ? "Warehouse return submitted successfully. Awaiting staff inspection."
                    : "Warehouse return approved. Contract will be closed automatically.";

                // Update status cho warehouse return
                if (status == "APPROVED")
                {
                    warehouseReturn.Approve();
                    await _returnRepository.UpdateAsync(warehouseReturn);
                }

                // Nếu không cần inspection thì close contract luôn
                if (!requiresInspection)
                {
                    contract.Close();
                    await _contractRepository.UpdateAsync(contract);
                    nextSteps += " Contract has been closed.";
                }

                // Gửi thông báo
                var notification = new Notification
                {
                    UserId = request.RenterId,
                    Title = "Warehouse Return Submitted",
                    Message = nextSteps,
                    Type = "warehouse_return_submitted",
                    CreatedAt = DateTime.UtcNow
                };

                await _notificationRepository.AddAsync(notification);
                await _notificationSender.SendToUserAsync(request.RenterId, notification);

                return new SubmitWarehouseReturnResponse
                {
                    Success = true,
                    Message = "Warehouse return submitted successfully",
                    ReturnId = returnId,
                    Status = status,
                    RequiresInspection = requiresInspection,
                    NextSteps = nextSteps
                };
            }
            catch (Exception ex)
            {
                return new SubmitWarehouseReturnResponse
                {
                    Success = false,
                    Message = $"Error submitting warehouse return: {ex.Message}"
                };
            }
        }
    }
}