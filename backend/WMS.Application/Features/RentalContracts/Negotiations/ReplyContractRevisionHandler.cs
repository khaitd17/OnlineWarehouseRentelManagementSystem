using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalContracts.Negotiations;

public class ReplyContractRevisionHandler : IRequestHandler<ReplyContractRevisionCommand, Unit>
{
    private readonly IRentalContractRepository _contractRepo;
    private readonly IWarehouseRepository _warehouseRepo;
    private readonly IContractRevisionThreadRepository _threadRepo;
    private readonly IContractRevisionCommentRepository _commentRepo;
    private readonly INotificationRepository _notificationRepo;
    private readonly INotificationSender _notificationSender;

    public ReplyContractRevisionHandler(
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

    public async Task<Unit> Handle(ReplyContractRevisionCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
            throw new ArgumentException("Message is required");

        var thread = await _threadRepo.GetByIdAsync(request.ThreadId)
            ?? throw new InvalidOperationException("Revision thread not found");

        var contract = await _contractRepo.GetByIdAsync(thread.ContractId)
            ?? throw new InvalidOperationException("Contract not found");

        var warehouse = await _warehouseRepo.GetByIdAsync(contract.WarehouseId, cancellationToken);

        var isRenter = contract.RenterId == request.UserId;
        var isOwner = warehouse?.OwnerId == request.UserId;
        if (!isRenter && !isOwner)
            throw new UnauthorizedAccessException("Access denied");

        var comment = new ContractRevisionComment
        {
            ThreadId = thread.ThreadId,
            UserId = request.UserId,
            Message = request.Message,
            CreatedAt = DateTime.UtcNow
        };
        await _commentRepo.AddAsync(comment);

        thread.UpdatedAt = DateTime.UtcNow;
        await _threadRepo.UpdateAsync(thread);

        var receiverId = isOwner ? contract.RenterId : warehouse?.OwnerId;
        if (receiverId.HasValue)
        {
            var notification = Notification.Create(
                receiverUserId: receiverId.Value,
                title: "Phản hồi đàm phán hợp đồng",
                message: $"Có phản hồi mới cho hợp đồng {contract.ContractNumber}.",
                notificationType: "CONTRACT_REVISION_REPLIED",
                referenceId: contract.ContractId,
                referenceType: "CONTRACT");
            await _notificationRepo.AddAsync(notification);
            await _notificationSender.SendToUserAsync(receiverId.Value, notification);
        }

        return Unit.Value;
    }
}
