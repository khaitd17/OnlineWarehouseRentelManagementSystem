using MediatR;
using WMS.Domain.Entities;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalContracts.DeclineContract;

public class DeclineContractHandler : IRequestHandler<DeclineContractCommand, Unit>
{
    private readonly IRentalContractRepository _contractRepository;
    private readonly ICancellationLogRepository _cancellationLogRepository;
    private readonly INotificationRepository _notificationRepository;

    public DeclineContractHandler(
        IRentalContractRepository contractRepository,
        ICancellationLogRepository cancellationLogRepository,
        INotificationRepository notificationRepository)
    {
        _contractRepository = contractRepository;
        _cancellationLogRepository = cancellationLogRepository;
        _notificationRepository = notificationRepository;
    }

    public async Task<Unit> Handle(DeclineContractCommand request, CancellationToken cancellationToken)
    {
        var contract = await _contractRepository.GetByIdAsync(request.ContractId);
        if (contract == null)
            throw new InvalidOperationException("Contract not found");

        // Verify user is renter or owner
        var isRenter = contract.RenterId == request.UserId;
        var isOwner = contract.Warehouse?.OwnerId == request.UserId;
        
        if (!isRenter && !isOwner)
            throw new UnauthorizedAccessException("Only renter or owner can decline this contract");

        // Can only decline if contract is waiting for signature
        if (contract.Status != RentalContractStatus.PendingOwnerSignature && 
            contract.Status != RentalContractStatus.PendingRenterSignature)
        {
            throw new InvalidOperationException($"Cannot decline contract with status {contract.Status}. Contract must be pending signature.");
        }

        if (string.IsNullOrWhiteSpace(request.Reason))
            throw new ArgumentException("Decline reason is required");

        // Cancel contract with reason
        var cancelledBy = isRenter ? "USER" : "OWNER";
        contract.CancelWithReason(request.Reason, cancelledBy);
        
        await _contractRepository.UpdateAsync(contract);

        // Log cancellation
        var cancellationLog = CancellationLog.Create(
            rentalRequestId: null,
            rentalContractId: contract.ContractId,
            cancelledStage: "CONTRACT",
            cancelledBy: cancelledBy,
            cancellationReason: request.Reason,
            refundAmount: null,
            cancellationFee: null
        );
        await _cancellationLogRepository.AddAsync(cancellationLog);

        // Send notification to other party
        var recipientId = isRenter ? contract.Warehouse!.OwnerId : contract.RenterId;
        
        var notification = Notification.Create(
            receiverUserId: recipientId,
            title: "Hợp đồng thuê kho đã bị từ chối",
            message: $"{(isRenter ? "Người thuê" : "Chủ kho")} đã từ chối ký hợp đồng {contract.ContractNumber}. Lý do: {request.Reason}",
            notificationType: "IN_APP",
            referenceId: contract.ContractId,
            referenceType: "RentalContract"
        );
        await _notificationRepository.AddAsync(notification);

        return Unit.Value;
    }
}
