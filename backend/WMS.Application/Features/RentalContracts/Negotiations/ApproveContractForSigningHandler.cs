using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalContracts.Negotiations;

public class ApproveContractForSigningHandler : IRequestHandler<ApproveContractForSigningCommand, ApproveContractForSigningResult>
{
    private readonly IRentalContractRepository _contractRepo;
    private readonly IWarehouseRepository _warehouseRepo;
    private readonly IContractRevisionThreadRepository _threadRepo;
    private readonly INotificationRepository _notificationRepo;
    private readonly INotificationSender _notificationSender;

    public ApproveContractForSigningHandler(
        IRentalContractRepository contractRepo,
        IWarehouseRepository warehouseRepo,
        IContractRevisionThreadRepository threadRepo,
        INotificationRepository notificationRepo,
        INotificationSender notificationSender)
    {
        _contractRepo = contractRepo;
        _warehouseRepo = warehouseRepo;
        _threadRepo = threadRepo;
        _notificationRepo = notificationRepo;
        _notificationSender = notificationSender;
    }

    public async Task<ApproveContractForSigningResult> Handle(ApproveContractForSigningCommand request, CancellationToken cancellationToken)
    {
        var contract = await _contractRepo.GetByIdAsync(request.ContractId)
            ?? throw new InvalidOperationException("Contract not found");

        var warehouse = await _warehouseRepo.GetByIdAsync(contract.WarehouseId, cancellationToken)
            ?? throw new InvalidOperationException("Warehouse not found");

        if (warehouse.OwnerId != request.UserId)
            throw new UnauthorizedAccessException("Only owner can approve for signing");

        var threads = await _threadRepo.GetByContractIdAsync(contract.ContractId);
        var hasPendingThreads = threads.Any(t => t.Status == ContractRevisionStatus.Open || t.Status == ContractRevisionStatus.Accepted);
        if (hasPendingThreads)
            throw new InvalidOperationException("Vẫn còn yêu cầu chỉnh sửa chưa xử lý");

        contract.ApproveForSigning();
        await _contractRepo.UpdateAsync(contract);

        var renterNotification = WMS.Domain.Entities.Notification.Create(
            receiverUserId: contract.RenterId,
            title: "Hợp đồng sẵn sàng ký",
            message: $"Hợp đồng {contract.ContractNumber} đã được duyệt để ký.",
            notificationType: "CONTRACT_READY_FOR_SIGNING",
            referenceId: contract.ContractId,
            referenceType: "CONTRACT");
        await _notificationRepo.AddAsync(renterNotification);
        await _notificationSender.SendToUserAsync(contract.RenterId, renterNotification);

        var ownerNotification = WMS.Domain.Entities.Notification.Create(
            receiverUserId: warehouse.OwnerId,
            title: "Hợp đồng sẵn sàng ký",
            message: $"Hợp đồng {contract.ContractNumber} đã được duyệt để ký.",
            notificationType: "CONTRACT_READY_FOR_SIGNING",
            referenceId: contract.ContractId,
            referenceType: "CONTRACT");
        await _notificationRepo.AddAsync(ownerNotification);
        await _notificationSender.SendToUserAsync(warehouse.OwnerId, ownerNotification);

        return new ApproveContractForSigningResult
        {
            Status = contract.Status
        };
    }
}
