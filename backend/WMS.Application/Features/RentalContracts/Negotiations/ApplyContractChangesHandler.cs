using MediatR;
using System.Text.Json;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalContracts.Negotiations;

public class ApplyContractChangesHandler : IRequestHandler<ApplyContractChangesCommand, ApplyContractChangesResult>
{
    private readonly IRentalContractRepository _contractRepo;
    private readonly IWarehouseRepository _warehouseRepo;
    private readonly IContractVersionRepository _versionRepo;
    private readonly IContractRevisionThreadRepository _threadRepo;
    private readonly INotificationRepository _notificationRepo;
    private readonly INotificationSender _notificationSender;

    public ApplyContractChangesHandler(
        IRentalContractRepository contractRepo,
        IWarehouseRepository warehouseRepo,
        IContractVersionRepository versionRepo,
        IContractRevisionThreadRepository threadRepo,
        INotificationRepository notificationRepo,
        INotificationSender notificationSender)
    {
        _contractRepo = contractRepo;
        _warehouseRepo = warehouseRepo;
        _versionRepo = versionRepo;
        _threadRepo = threadRepo;
        _notificationRepo = notificationRepo;
        _notificationSender = notificationSender;
    }

    public async Task<ApplyContractChangesResult> Handle(ApplyContractChangesCommand request, CancellationToken cancellationToken)
    {
        var contract = await _contractRepo.GetByIdAsync(request.ContractId)
            ?? throw new InvalidOperationException("Contract not found");

        var warehouse = await _warehouseRepo.GetByIdAsync(contract.WarehouseId, cancellationToken)
            ?? throw new InvalidOperationException("Warehouse not found");

        if (warehouse.OwnerId != request.UserId)
            throw new UnauthorizedAccessException("Only owner can apply changes");

        if (request.DurationMonths < 1)
            throw new ArgumentException("Duration must be at least 1 month");

        contract.UpdateNegotiatedTerms(
            request.MonthlyPayment,
            request.DepositAmount,
            request.StartDate,
            request.DurationMonths,
            request.Terms);

        contract.MarkNegotiating();
        await _contractRepo.UpdateAsync(contract);

        if (request.ResolveThreadIds != null && request.ResolveThreadIds.Count > 0)
        {
            foreach (var threadId in request.ResolveThreadIds.Distinct())
            {
                var thread = await _threadRepo.GetByIdAsync(threadId);
                if (thread == null || thread.ContractId != contract.ContractId)
                    continue;

                thread.Status = ContractRevisionStatus.Resolved;
                thread.ResolvedBy = request.UserId;
                thread.ResolvedAt = DateTime.UtcNow;
                thread.UpdatedAt = DateTime.UtcNow;
                await _threadRepo.UpdateAsync(thread);
            }
        }

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
            title: "Hợp đồng được cập nhật",
            message: $"Một phiên bản mới đã được tạo cho hợp đồng {contract.ContractNumber}.",
            notificationType: "CONTRACT_VERSION_CREATED",
            referenceId: contract.ContractId,
            referenceType: "CONTRACT");
        await _notificationRepo.AddAsync(notification);
        await _notificationSender.SendToUserAsync(contract.RenterId, notification);

        return new ApplyContractChangesResult
        {
            VersionNumber = nextVersion,
            Status = contract.Status
        };
    }
}
