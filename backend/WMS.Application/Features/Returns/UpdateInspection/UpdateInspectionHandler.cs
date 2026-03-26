using MediatR;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;
using WMS.Domain.Entities;
using WMS.Application.Interfaces;

namespace WMS.Application.Features.Returns.UpdateInspection
{
    public class UpdateInspectionHandler : IRequestHandler<UpdateInspectionCommand, UpdateInspectionResponse>
    {
        private readonly IWarehouseReturnRepository _returnRepository;
        private readonly IRentalContractRepository _contractRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly INotificationSender _notificationSender;

        public UpdateInspectionHandler(
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

        public async Task<UpdateInspectionResponse> Handle(UpdateInspectionCommand request, CancellationToken cancellationToken)
        {
            try
            {
                // Lấy warehouse return
                var warehouseReturn = await _returnRepository.GetByIdAsync(request.ReturnId);
                if (warehouseReturn == null)
                {
                    return new UpdateInspectionResponse
                    {
                        Success = false,
                        Message = "Warehouse return not found",
                        ReturnId = request.ReturnId
                    };
                }

                // Submit inspection
                warehouseReturn.SubmitInspection(
                    inspectorId: request.InspectorId,
                    isClean: request.IsClean,
                    isEquipmentIntact: request.IsEquipmentIntact,
                    isNoOutstandingDebt: request.IsNoOutstandingDebt,
                    notes: request.Notes,
                    damageFee: request.DamageFee,
                    penaltyFee: request.PenaltyFee);

                await _returnRepository.UpdateAsync(warehouseReturn);

                // Complete return
                warehouseReturn.Complete();
                await _returnRepository.UpdateAsync(warehouseReturn);

                // Close contract với damage compensation nếu có
                var contract = await _contractRepository.GetByIdAsync(warehouseReturn.ContractId);
                if (contract != null && contract.Status == RentalContractStatus.Completed)
                {
                    contract.Close(damageCompensation: warehouseReturn.TotalFee, returnNotes: request.Notes);
                    await _contractRepository.UpdateAsync(contract);
                }

                // Gửi thông báo
                var totalFees = warehouseReturn.TotalFee;
                var message = totalFees > 0
                    ? $"Warehouse inspection completed. Total fees: {totalFees:C}. Contract has been closed."
                    : "Warehouse inspection completed. No issues found. Contract has been closed.";

                var notification = new Notification
                {
                    UserId = contract?.RenterId ?? 0,
                    Title = "Warehouse Inspection Completed",
                    Message = message,
                    Type = "warehouse_inspection_completed",
                    CreatedAt = DateTime.UtcNow
                };

                if (contract?.RenterId > 0)
                {
                    await _notificationRepository.AddAsync(notification);
                    await _notificationSender.SendToUserAsync(contract.RenterId, notification);
                }

                return new UpdateInspectionResponse
                {
                    Success = true,
                    Message = "Warehouse inspection completed successfully",
                    ReturnId = request.ReturnId,
                    Status = warehouseReturn.Status,
                    TotalFees = totalFees,
                    ContractClosed = true
                };
            }
            catch (Exception ex)
            {
                return new UpdateInspectionResponse
                {
                    Success = false,
                    Message = $"Error updating inspection: {ex.Message}",
                    ReturnId = request.ReturnId
                };
            }
        }
    }
}