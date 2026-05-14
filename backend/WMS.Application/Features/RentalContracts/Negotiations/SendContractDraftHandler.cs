using MediatR;
using System.Text.Json;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalContracts.Negotiations;

public class SendContractDraftHandler : IRequestHandler<SendContractDraftCommand, SendContractDraftResult>
{
    private readonly IRentalContractRepository _contractRepo;
    private readonly IWarehouseRepository _warehouseRepo;
    private readonly IContractVersionRepository _versionRepo;
    private readonly INotificationRepository _notificationRepo;
    private readonly INotificationSender _notificationSender;
    private readonly IUserRepository _userRepository;
    private readonly IEmailService _emailService;

    public SendContractDraftHandler(
        IRentalContractRepository contractRepo,
        IWarehouseRepository warehouseRepo,
        IContractVersionRepository versionRepo,
        INotificationRepository notificationRepo,
        INotificationSender notificationSender,
        IUserRepository userRepository,
        IEmailService emailService)
    {
        _contractRepo = contractRepo;
        _warehouseRepo = warehouseRepo;
        _versionRepo = versionRepo;
        _notificationRepo = notificationRepo;
        _notificationSender = notificationSender;
        _userRepository = userRepository;
        _emailService = emailService;
    }

    public async Task<SendContractDraftResult> Handle(SendContractDraftCommand request, CancellationToken cancellationToken)
    {
        var contract = await _contractRepo.GetByIdAsync(request.ContractId)
            ?? throw new InvalidOperationException("Contract not found");

        var warehouse = await _warehouseRepo.GetByIdAsync(contract.WarehouseId, cancellationToken)
            ?? throw new InvalidOperationException("Warehouse not found");

        if (warehouse.OwnerId != request.UserId)
            throw new UnauthorizedAccessException("Only owner can send draft");

        if (contract.Status != RentalContractStatus.Draft)
            throw new InvalidOperationException($"Cannot send draft for contract with status {contract.Status}");

        contract.MarkNegotiating();
        await _contractRepo.UpdateAsync(contract);

        var versions = await _versionRepo.GetByContractIdAsync(contract.ContractId);
        var nextVersion = versions.Count == 0 ? 1 : versions.Max(v => v.VersionNumber) + 1;
        var snapshot = new
        {
            contract.ContractId,
            contract.ContractNumber,
            contract.StartDate,
            contract.EndDate,
            contract.MonthlyPayment,
            contract.DepositAmount,
            contract.TotalValue,
            contract.Terms,
            contract.Status,
            contract.UpdatedAt
        };

        var version = new ContractVersion
        {
            ContractId = contract.ContractId,
            VersionNumber = nextVersion,
            SnapshotJson = JsonSerializer.Serialize(snapshot),
            CreatedBy = request.UserId,
            CreatedAt = DateTime.UtcNow
        };
        await _versionRepo.AddAsync(version);

        var notification = Notification.Create(
            receiverUserId: contract.RenterId,
            title: "Hợp đồng nháp đã được gửi",
            message: $"Chủ kho đã gửi bản nháp hợp đồng {contract.ContractNumber}. Vui lòng xem và phản hồi.",
            notificationType: "CONTRACT_DRAFT_SENT",
            referenceId: contract.ContractId,
            referenceType: "CONTRACT");
        await _notificationRepo.AddAsync(notification);
        await _notificationSender.SendToUserAsync(contract.RenterId, notification);

        var renter = await _userRepository.GetByIdAsync(contract.RenterId, cancellationToken);
        if (renter != null && !string.IsNullOrWhiteSpace(renter.Email))
        {
            var subject = $"Bản nháp hợp đồng đã được gửi - {warehouse.Name}";
            var contractLink = $"http://localhost:3000/contracts/{contract.ContractId}?tab=negotiation";
            var htmlContent = $@"
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;'>
    <h2 style='color: #2563eb; text-align: center;'>Bản nháp hợp đồng đã được gửi</h2>
    <p>Xin chào <strong>{renter.FullName}</strong>,</p>
    <p>Chủ kho đã gửi bản nháp hợp đồng <strong>{contract.ContractNumber}</strong> cho kho <strong>{warehouse.Name}</strong>.</p>
    <div style='background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 16px 0;'>
        <ul style='color: #4b5563; line-height: 1.6;'>
            <li><strong>Giá thuê/tháng:</strong> {contract.MonthlyPayment:N0} VNĐ</li>
            <li><strong>Tiền đặt cọc:</strong> {contract.DepositAmount:N0} VNĐ</li>
            <li><strong>Thời gian bắt đầu:</strong> {contract.StartDate:dd/MM/yyyy}</li>
            <li><strong>Thời gian kết thúc:</strong> {contract.EndDate:dd/MM/yyyy}</li>
        </ul>
    </div>
    <div style='margin-top: 24px; text-align: center;'>
        <a href='{contractLink}' style='background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;'>Xem và phản hồi hợp đồng</a>
    </div>
    <hr style='border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;' />
    <p style='font-size: 12px; color: #9ca3af; text-align: center;'>Đây là email tự động từ hệ thống OWRMS. Vui lòng không trả lời email này.</p>
</div>";

            await _emailService.SendInfo(renter.Email, renter.FullName, subject, htmlContent);
        }

        return new SendContractDraftResult
        {
            Status = contract.Status
        };
    }
}
