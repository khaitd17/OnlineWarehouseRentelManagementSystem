using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalContracts.Negotiations;

public class RequestContractRevisionHandler : IRequestHandler<RequestContractRevisionCommand, RequestContractRevisionResult>
{
    private readonly IRentalContractRepository _contractRepo;
    private readonly IWarehouseRepository _warehouseRepo;
    private readonly IContractRevisionThreadRepository _threadRepo;
    private readonly IContractRevisionCommentRepository _commentRepo;
    private readonly INotificationRepository _notificationRepo;
    private readonly INotificationSender _notificationSender;

    public RequestContractRevisionHandler(
        IRentalContractRepository contractRepo,
        IWarehouseRepository warehouseRepo,
        IContractRevisionThreadRepository threadRepo,
        IContractRevisionCommentRepository commentRepo,
        INotificationRepository notificationRepo,
        INotificationSender notificationSender)
    {
        _contractRepo = contractRepo;
        _warehouseRepo = warehouseRepo;
        _threadRepo = threadRepo;
        _commentRepo = commentRepo;
        _notificationRepo = notificationRepo;
        _notificationSender = notificationSender;
    }

    public async Task<RequestContractRevisionResult> Handle(RequestContractRevisionCommand request, CancellationToken cancellationToken)
    {
        var contract = await _contractRepo.GetByIdAsync(request.ContractId)
            ?? throw new InvalidOperationException("Contract not found");

        var warehouse = await _warehouseRepo.GetByIdAsync(contract.WarehouseId, cancellationToken);

        if (contract.RenterId != request.UserId)
            throw new UnauthorizedAccessException("Only renter can request revision");

        if (contract.Status != RentalContractStatus.Negotiating &&
            contract.Status != RentalContractStatus.RevisionRequested)
        {
            throw new InvalidOperationException($"Cannot request revision for contract with status {contract.Status}");
        }

        if (string.IsNullOrWhiteSpace(request.Message))
            throw new ArgumentException("Message is required");

        if (string.IsNullOrWhiteSpace(request.Section))
            throw new ArgumentException("Section is required");

        var thread = new ContractRevisionThread
        {
            ContractId = contract.ContractId,
            Section = request.Section,
            Status = ContractRevisionStatus.Open,
            CreatedBy = request.UserId,
            CreatedAt = DateTime.UtcNow
        };
        var threadId = await _threadRepo.AddAsync(thread);

        var comment = new ContractRevisionComment
        {
            ThreadId = threadId,
            UserId = request.UserId,
            Message = request.Message,
            CreatedAt = DateTime.UtcNow
        };
        await _commentRepo.AddAsync(comment);

        contract.RequestRevision();
        await _contractRepo.UpdateAsync(contract);

        if (warehouse != null)
        {
            var notification = Notification.Create(
                receiverUserId: warehouse.OwnerId,
                title: "Yêu cầu chỉnh sửa hợp đồng",
                message: $"Người thuê yêu cầu chỉnh sửa mục {request.Section} trong hợp đồng {contract.ContractNumber}.",
                notificationType: "CONTRACT_REVISION_REQUESTED",
                referenceId: contract.ContractId,
                referenceType: "CONTRACT");
            await _notificationRepo.AddAsync(notification);
            await _notificationSender.SendToUserAsync(warehouse.OwnerId, notification);
        }

        return new RequestContractRevisionResult
        {
            ThreadId = threadId,
            Status = contract.Status
        };
    }
}
