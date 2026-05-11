using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalContracts.Negotiations;

public class UpdateContractRevisionStatusHandler : IRequestHandler<UpdateContractRevisionStatusCommand, Unit>
{
    private readonly IRentalContractRepository _contractRepo;
    private readonly IWarehouseRepository _warehouseRepo;
    private readonly IContractRevisionThreadRepository _threadRepo;
    private readonly INotificationRepository _notificationRepo;
    private readonly INotificationSender _notificationSender;

    public UpdateContractRevisionStatusHandler(
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

    public async Task<Unit> Handle(UpdateContractRevisionStatusCommand request, CancellationToken cancellationToken)
    {
        var thread = await _threadRepo.GetByIdAsync(request.ThreadId)
            ?? throw new InvalidOperationException("Revision thread not found");

        var contract = await _contractRepo.GetByIdAsync(thread.ContractId)
            ?? throw new InvalidOperationException("Contract not found");

        var warehouse = await _warehouseRepo.GetByIdAsync(contract.WarehouseId, cancellationToken)
            ?? throw new InvalidOperationException("Warehouse not found");

        if (warehouse.OwnerId != request.UserId)
            throw new UnauthorizedAccessException("Only owner can update revision status");

        var normalizedStatus = request.Status?.Trim().ToUpperInvariant();
        if (normalizedStatus != ContractRevisionStatus.Accepted && normalizedStatus != ContractRevisionStatus.Rejected)
            throw new ArgumentException("Invalid revision status");

        thread.Status = normalizedStatus;
        thread.UpdatedAt = DateTime.UtcNow;
        await _threadRepo.UpdateAsync(thread);

        var notificationType = normalizedStatus == ContractRevisionStatus.Accepted
            ? "CONTRACT_REVISION_ACCEPTED"
            : "CONTRACT_REVISION_REJECTED";
        var notification = WMS.Domain.Entities.Notification.Create(
            receiverUserId: contract.RenterId,
            title: "Cập nhật yêu cầu chỉnh sửa",
            message: $"Chủ kho đã {normalizedStatus.ToLower()} yêu cầu chỉnh sửa mục {thread.Section} cho hợp đồng {contract.ContractNumber}.",
            notificationType: notificationType,
            referenceId: contract.ContractId,
            referenceType: "CONTRACT");
        await _notificationRepo.AddAsync(notification);
        await _notificationSender.SendToUserAsync(contract.RenterId, notification);

        return Unit.Value;
    }
}
