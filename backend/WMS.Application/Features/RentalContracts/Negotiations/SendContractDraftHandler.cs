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

    public SendContractDraftHandler(
        IRentalContractRepository contractRepo,
        IWarehouseRepository warehouseRepo,
        IContractVersionRepository versionRepo,
        INotificationRepository notificationRepo,
        INotificationSender notificationSender)
    {
        _contractRepo = contractRepo;
        _warehouseRepo = warehouseRepo;
        _versionRepo = versionRepo;
        _notificationRepo = notificationRepo;
        _notificationSender = notificationSender;
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

        return new SendContractDraftResult
        {
            Status = contract.Status
        };
    }
}
