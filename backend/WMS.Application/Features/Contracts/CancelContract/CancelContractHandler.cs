using MediatR;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;
using WMS.Application.Interfaces;

namespace WMS.Application.Features.Contracts.CancelContract
{
    public class CancelContractHandler : IRequestHandler<CancelContractCommand, CancelContractResponse>
    {
        private readonly IRentalContractRepository _contractRepository;
        private readonly IRentalRequestRepository _rentalRequestRepository;
        private readonly IWarehouseRepository _warehouseRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly INotificationSender _notificationSender;
        private readonly IRenterAssetRepository _assetRepo;

        public CancelContractHandler(
            IRentalContractRepository contractRepository,
            IRentalRequestRepository rentalRequestRepository,
            IWarehouseRepository warehouseRepository,
            INotificationRepository notificationRepository,
            INotificationSender notificationSender,
            IRenterAssetRepository assetRepo)
        {
            _contractRepository = contractRepository;
            _rentalRequestRepository = rentalRequestRepository;
            _warehouseRepository = warehouseRepository;
            _notificationRepository = notificationRepository;
            _notificationSender = notificationSender;
            _assetRepo = assetRepo;
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
                               contract.Status == RentalContractStatus.PendingRenterSignature ||
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

                // Xóa tồn kho của renter tại kho này khi hủy hợp đồng
                // (tránh tồn kho cũ hiển thị sai trong hợp đồng mới)
                try
                {
                    await _assetRepo.ClearRenterInventoryAsync(
                        contract.RenterId, contract.WarehouseId, cancellationToken);
                }
                catch { /* không chặn luồng hủy vì đây là cleanup */ }

                // Revert available area for the warehouse
                var rentalRequest = await _rentalRequestRepository.GetByIdAsync(contract.RentalRequestId);
                if (rentalRequest != null)
                {
                    var warehouse = await _warehouseRepository.GetByIdAsync(rentalRequest.WarehouseId, cancellationToken);
                    if (warehouse != null)
                    {
                        warehouse.AvailableArea += rentalRequest.RequestedArea;
                        if (warehouse.AvailableArea > warehouse.TotalArea)
                        {
                            warehouse.AvailableArea = warehouse.TotalArea; // Ensure it doesn't exceed total
                        }
                        await _warehouseRepository.UpdateAsync(warehouse, cancellationToken);
                        
                        // Also mark rental request as cancelled
                        rentalRequest.Status = "CANCELLED";
                        await _rentalRequestRepository.UpdateAsync(rentalRequest);
                    }
                }

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