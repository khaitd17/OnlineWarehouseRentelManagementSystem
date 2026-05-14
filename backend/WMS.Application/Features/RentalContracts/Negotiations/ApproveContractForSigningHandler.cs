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
    private readonly IUserRepository _userRepository;
    private readonly IEmailService _emailService;

    public ApproveContractForSigningHandler(
        IRentalContractRepository contractRepo,
        IWarehouseRepository warehouseRepo,
        IContractRevisionThreadRepository threadRepo,
        INotificationRepository notificationRepo,
        INotificationSender notificationSender,
        IUserRepository userRepository,
        IEmailService emailService)
    {
        _contractRepo = contractRepo;
        _warehouseRepo = warehouseRepo;
        _threadRepo = threadRepo;
        _notificationRepo = notificationRepo;
        _notificationSender = notificationSender;
        _userRepository = userRepository;
        _emailService = emailService;
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

        var renter = await _userRepository.GetByIdAsync(contract.RenterId, cancellationToken);
        var owner = await _userRepository.GetByIdAsync(warehouse.OwnerId, cancellationToken);
        var contractLink = $"http://localhost:3000/contracts/{contract.ContractId}?tab=signing";

        if (renter != null && !string.IsNullOrWhiteSpace(renter.Email))
        {
            var subject = $"Hợp đồng sẵn sàng ký - {contract.ContractNumber}";
            var htmlContent = $@"
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;'>
    <h2 style='color: #16a34a; text-align: center;'>Hợp đồng sẵn sàng ký</h2>
    <p>Xin chào <strong>{renter.FullName}</strong>,</p>
    <p>Hợp đồng <strong>{contract.ContractNumber}</strong> đã được duyệt để ký. Vui lòng kiểm tra và ký hợp đồng.</p>
    <div style='margin-top: 24px; text-align: center;'>
        <a href='{contractLink}' style='background-color: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;'>Ký hợp đồng</a>
    </div>
    <hr style='border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;' />
    <p style='font-size: 12px; color: #9ca3af; text-align: center;'>Đây là email tự động từ hệ thống OWRMS. Vui lòng không trả lời email này.</p>
</div>";

            await _emailService.SendInfo(renter.Email, renter.FullName, subject, htmlContent);
        }

        if (owner != null && !string.IsNullOrWhiteSpace(owner.Email))
        {
            var subject = $"Hợp đồng sẵn sàng ký - {contract.ContractNumber}";
            var htmlContent = $@"
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;'>
    <h2 style='color: #16a34a; text-align: center;'>Hợp đồng sẵn sàng ký</h2>
    <p>Xin chào <strong>{owner.FullName}</strong>,</p>
    <p>Hợp đồng <strong>{contract.ContractNumber}</strong> đã được duyệt để ký. Bạn có thể tiến hành ký hợp đồng.</p>
    <div style='margin-top: 24px; text-align: center;'>
        <a href='{contractLink}' style='background-color: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;'>Ký hợp đồng</a>
    </div>
    <hr style='border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;' />
    <p style='font-size: 12px; color: #9ca3af; text-align: center;'>Đây là email tự động từ hệ thống OWRMS. Vui lòng không trả lời email này.</p>
</div>";

            await _emailService.SendInfo(owner.Email, owner.FullName, subject, htmlContent);
        }

        return new ApproveContractForSigningResult
        {
            Status = contract.Status
        };
    }
}
