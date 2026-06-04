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

        if (contract.Status != "DRAFT" && contract.Status != "NEGOTIATING" && contract.Status != "REVISION_REQUESTED")
            throw new InvalidOperationException("Chỉ có thể chỉnh sửa hợp đồng đang ở trạng thái nháp hoặc đàm phán.");

        if (request.MonthlyPayment < 1000)
            throw new ArgumentException("Giá thuê hàng tháng phải từ 1,000 VNĐ trở lên.");
        if (request.MonthlyPayment > 100_000_000_000m)
            throw new ArgumentException("Giá thuê hàng tháng không được vượt quá 100 tỷ VNĐ.");

        if (request.DepositAmount.HasValue && request.DepositAmount.Value < 0)
            throw new ArgumentException("Tiền đặt cọc không được là số âm.");
        if (request.DepositAmount.HasValue && request.DepositAmount.Value > 100_000_000_000m)
            throw new ArgumentException("Tiền đặt cọc không được vượt quá 100 tỷ VNĐ.");

        var today = DateTime.Today;
        if (request.StartDate.Date < today)
            throw new ArgumentException("Ngày bắt đầu không được là ngày trong quá khứ.");
        if (request.StartDate.Date > today.AddYears(2))
            throw new ArgumentException("Ngày bắt đầu không được vượt quá 2 năm kể từ hôm nay.");

        if (request.DurationMonths < 1 || request.DurationMonths > 120)
            throw new ArgumentException("Thời hạn hợp đồng phải từ 1 đến 120 tháng.");

        var validTerms = new[] { 1, 3, 6, 12 };
        if (!validTerms.Contains(request.MonthsPerTerm))
            throw new ArgumentException("Kỳ hạn thanh toán không hợp lệ.");
        if (request.MonthsPerTerm > request.DurationMonths)
            throw new ArgumentException("Kỳ hạn thanh toán không được lớn hơn thời hạn hợp đồng.");

        var validOverdue = new[] { 0, 3, 5, 7 };
        if (!validOverdue.Contains(request.AllowedOverdueDays))
            throw new ArgumentException("Số ngày trễ hạn cho phép không hợp lệ.");

        if (string.IsNullOrWhiteSpace(request.Terms))
            throw new ArgumentException("Nội dung điều khoản hợp đồng không được để trống.");
        if (request.Terms.Length > 10000)
            throw new ArgumentException("Nội dung điều khoản không được vượt quá 10,000 ký tự.");

        contract.UpdateNegotiatedTerms(
            request.MonthlyPayment,
            request.DepositAmount,
            request.StartDate,
            request.DurationMonths,
            request.Terms,
            request.MonthsPerTerm,
            request.AllowedOverdueDays);

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
