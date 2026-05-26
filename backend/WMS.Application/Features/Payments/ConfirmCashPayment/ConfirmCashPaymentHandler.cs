using MediatR;
using Microsoft.Extensions.Logging;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Payments.ConfirmCashPayment;

public class ConfirmCashPaymentHandler : IRequestHandler<ConfirmCashPaymentCommand, ConfirmCashPaymentResult>
{
    private readonly IRentalPaymentRepository _paymentRepo;
    private readonly IRentalContractRepository _contractRepo;
    private readonly IWarehouseRepository _warehouseRepo;
    private readonly INotificationRepository _notificationRepo;
    private readonly INotificationSender _notificationSender;
    private readonly IStaffMembershipRepository _membershipRepo;
    private readonly ILogger<ConfirmCashPaymentHandler> _logger;
    private readonly IContractExtensionRepository _extensionRepo;
    private readonly IRentalRequestRepository _rentalRequestRepo;
    private readonly IUserRepository _userRepository;
    private readonly IEmailService _emailService;

    public ConfirmCashPaymentHandler(
        IRentalPaymentRepository paymentRepo,
        IRentalContractRepository contractRepo,
        IWarehouseRepository warehouseRepo,
        INotificationRepository notificationRepo,
        INotificationSender notificationSender,
        IStaffMembershipRepository membershipRepo,
        ILogger<ConfirmCashPaymentHandler> logger,
        IContractExtensionRepository extensionRepo,
        IRentalRequestRepository rentalRequestRepo,
        IUserRepository userRepository,
        IEmailService emailService)
    {
        _paymentRepo = paymentRepo;
        _contractRepo = contractRepo;
        _warehouseRepo = warehouseRepo;
        _notificationRepo = notificationRepo;
        _notificationSender = notificationSender;
        _membershipRepo = membershipRepo;
        _logger = logger;
        _extensionRepo = extensionRepo;
        _rentalRequestRepo = rentalRequestRepo;
        _userRepository = userRepository;
        _emailService = emailService;
    }

    public async Task<ConfirmCashPaymentResult> Handle(ConfirmCashPaymentCommand request, CancellationToken cancellationToken)
    {
        var payment = await _paymentRepo.GetByIdAsync(request.PaymentId);
        if (payment == null)
        {
            return new ConfirmCashPaymentResult
            {
                Success = false,
                Message = "Không tìm thấy thanh toán"
            };
        }

        // Check if payment is pending confirmation
        if (payment.Status != "PENDING_CONFIRMATION")
        {
            return new ConfirmCashPaymentResult
            {
                Success = false,
                Message = $"Thanh toán không ở trạng thái chờ xác nhận (hiện tại: {payment.Status})"
            };
        }

        var contract = await _contractRepo.GetByIdAsync(payment.ContractId);
        if (contract == null)
        {
            return new ConfirmCashPaymentResult
            {
                Success = false,
                Message = "Không tìm thấy hợp đồng"
            };
        }

        // Verify owner permission
        var warehouse = await _warehouseRepo.GetByIdAsync(contract.WarehouseId, cancellationToken);
        if (warehouse == null || warehouse.OwnerId != request.OwnerId)
        {
            return new ConfirmCashPaymentResult
            {
                Success = false,
                Message = "Bạn không có quyền xác nhận thanh toán này"
            };
        }

        // ── Module 5: Payment Validation ───────────────────────────────────
        // Nếu từ chối: phải có lý do
        if (!request.IsApproved)
        {
            if (string.IsNullOrWhiteSpace(request.RejectionReason))
                return new ConfirmCashPaymentResult { Success = false, Message = "Vui lòng nhập lý do từ chối thanh toán." };
            if (request.RejectionReason!.Trim().Length > 500)
                return new ConfirmCashPaymentResult { Success = false, Message = "Lý do từ chối không được vượt quá 500 ký tự." };
        }
        // ───────────────────────────────────────────────────────────────────

        if (request.IsApproved)
        {
            // Complete the payment
            payment.Status = PaymentStatus.Completed;

            // Update contract state by payment type
            if (payment.PaymentType == PaymentType.Extension)
            {
                await ApplyExtensionAfterSuccessfulPaymentAsync(payment.ContractId);
                contract = await _contractRepo.GetByIdAsync(contract.ContractId) ?? contract;
            }
            else if (payment.PaymentType == PaymentType.Penalty &&
                contract.Status == RentalContractStatus.PendingTermination)
            {
                await _contractRepo.FinalizeTerminationAfterPaymentAsync(contract.ContractId);
                contract = await _contractRepo.GetByIdAsync(contract.ContractId) ?? contract;
            }
            else if (contract.Status == RentalContractStatus.PendingPayment)
            {
                // Activate contract when paying deposit/monthly
                contract.ActivateAfterPayment();
                await _contractRepo.UpdateAsync(contract);

                // Deduct area from warehouse now that contract is ACTIVE
                await DeductWarehouseAreaAsync(contract, warehouse);
            }
            else
            {
                // Backward-compatible fallback for legacy flows
                contract.ForceActivate();
                await _contractRepo.UpdateAsync(contract);

                // Deduct area from warehouse now that contract is ACTIVE
                await DeductWarehouseAreaAsync(contract, warehouse);
            }

            await _paymentRepo.UpdateAsync(payment);

            // Create warehouse membership for renter (Quản lý kho role)
            if (contract.Status == RentalContractStatus.Active)
            {
                await CreateRenterMembershipAsync(contract.RenterId, contract.WarehouseId, cancellationToken);
            }

            // Send notification to renter
            var notification = new Notification
            {
                UserId = contract.RenterId,
                Title = payment.PaymentType == PaymentType.Penalty
                    ? "🎉 Thanh toán phí kết thúc sớm đã được xác nhận"
                    : "🎉 Thanh toán đã được xác nhận",
                Message = payment.PaymentType == PaymentType.Penalty
                    ? $"Chủ kho đã xác nhận thanh toán tiền mặt cho hợp đồng {contract.ContractNumber}. Hợp đồng đã được kết thúc sớm."
                    : $"Chủ kho đã xác nhận thanh toán tiền mặt cho hợp đồng {contract.ContractNumber}. Hợp đồng đã được kích hoạt! Bạn giờ đã có quyền quản lý kho.",
                Type = "PAYMENT_CONFIRMED",
                ReferenceId = contract.ContractId,
                ReferenceType = "CONTRACT",
                CreatedAt = DateTime.UtcNow
            };

            await _notificationRepo.AddAsync(notification);
            await _notificationSender.SendToUserAsync(contract.RenterId, notification);

            var renter = await _userRepository.GetByIdAsync(contract.RenterId, cancellationToken);
            var owner = await _userRepository.GetByIdAsync(warehouse.OwnerId, cancellationToken);
            var paymentLabel = payment.PaymentType == PaymentType.Penalty
                ? "phí kết thúc sớm"
                : payment.PaymentType == PaymentType.Extension
                    ? "gia hạn hợp đồng"
                    : "thanh toán hợp đồng";
            var subject = payment.PaymentType == PaymentType.Penalty
                ? "Thanh toán phí kết thúc sớm thành công"
                : payment.PaymentType == PaymentType.Extension
                    ? "Thanh toán gia hạn thành công"
                    : "Thanh toán thành công";
            var contractLink = $"http://localhost:3000/contracts/{contract.ContractId}";

            if (renter != null && !string.IsNullOrWhiteSpace(renter.Email))
            {
                var htmlContent = $@"
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;'>
    <h2 style='color: #16a34a; text-align: center;'>Thanh toán thành công</h2>
    <p>Xin chào <strong>{renter.FullName}</strong>,</p>
    <p>Chủ kho đã xác nhận {paymentLabel} cho hợp đồng <strong>{contract.ContractNumber}</strong>.</p>
    <div style='background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 16px 0;'>
        <ul style='color: #4b5563; line-height: 1.6;'>
            <li><strong>Số tiền:</strong> {payment.Amount:N0} VNĐ</li>
            <li><strong>Phương thức:</strong> {payment.PaymentMethod}</li>
            <li><strong>Mã thanh toán:</strong> {payment.PaymentCode}</li>
        </ul>
    </div>
    <div style='margin-top: 24px; text-align: center;'>
        <a href='{contractLink}' style='background-color: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;'>Xem hợp đồng</a>
    </div>
    <hr style='border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;' />
    <p style='font-size: 12px; color: #9ca3af; text-align: center;'>Đây là email tự động từ hệ thống OWRMS. Vui lòng không trả lời email này.</p>
</div>";

                await _emailService.SendInfo(renter.Email, renter.FullName, subject, htmlContent);
            }

            if (owner != null && !string.IsNullOrWhiteSpace(owner.Email))
            {
                var htmlContent = $@"
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;'>
    <h2 style='color: #16a34a; text-align: center;'>Thanh toán đã được xác nhận</h2>
    <p>Xin chào <strong>{owner.FullName}</strong>,</p>
    <p>Bạn đã xác nhận {paymentLabel} cho hợp đồng <strong>{contract.ContractNumber}</strong>.</p>
    <div style='background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 16px 0;'>
        <ul style='color: #4b5563; line-height: 1.6;'>
            <li><strong>Số tiền:</strong> {payment.Amount:N0} VNĐ</li>
            <li><strong>Phương thức:</strong> {payment.PaymentMethod}</li>
            <li><strong>Mã thanh toán:</strong> {payment.PaymentCode}</li>
        </ul>
    </div>
    <div style='margin-top: 24px; text-align: center;'>
        <a href='{contractLink}' style='background-color: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;'>Xem hợp đồng</a>
    </div>
    <hr style='border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;' />
    <p style='font-size: 12px; color: #9ca3af; text-align: center;'>Đây là email tự động từ hệ thống OWRMS. Vui lòng không trả lời email này.</p>
</div>";

                await _emailService.SendInfo(owner.Email, owner.FullName, subject, htmlContent);
            }

            _logger.LogInformation("Cash payment {PaymentId} confirmed by owner {OwnerId}. Contract {ContractId} status is now {Status}",
                request.PaymentId, request.OwnerId, contract.ContractId, contract.Status);

            return new ConfirmCashPaymentResult
            {
                Success = true,
                Message = payment.PaymentType == PaymentType.Penalty
                    ? "Đã xác nhận thanh toán thành công. Hợp đồng đã được kết thúc sớm."
                    : payment.PaymentType == PaymentType.Extension
                        ? "Đã xác nhận thanh toán gia hạn. Hợp đồng đã được cập nhật thời hạn."
                    : "Đã xác nhận thanh toán thành công. Hợp đồng đã được kích hoạt và người thuê đã được cấp quyền quản lý kho.",
                NewContractStatus = contract.Status
            };
        }
        else
        {
            // Reject the payment
            payment.Status = PaymentStatus.Cancelled;

            await _paymentRepo.UpdateAsync(payment);

            // Send notification to renter
            var notification = new Notification
            {
                UserId = contract.RenterId,
                Title = "Thanh toán bị từ chối",
                Message = $"Chủ kho đã từ chối xác nhận thanh toán tiền mặt cho hợp đồng {contract.ContractNumber}. Lý do: {request.RejectionReason ?? "Không có lý do"}",
                Type = "PAYMENT_REJECTED",
                ReferenceId = contract.ContractId,
                ReferenceType = "CONTRACT",
                CreatedAt = DateTime.UtcNow
            };

            await _notificationRepo.AddAsync(notification);
            await _notificationSender.SendToUserAsync(contract.RenterId, notification);

            _logger.LogInformation("Cash payment {PaymentId} rejected by owner {OwnerId}. Reason: {Reason}",
                request.PaymentId, request.OwnerId, request.RejectionReason);

            return new ConfirmCashPaymentResult
            {
                Success = true,
                Message = "Đã từ chối thanh toán.",
                NewContractStatus = contract.Status
            };
        }
    }

    private async Task ApplyExtensionAfterSuccessfulPaymentAsync(int contractId)
    {
        var extension = await _extensionRepo.GetPendingByContractIdAsync(contractId);
        if (extension == null || extension.Status != ContractExtensionStatus.PendingPayment)
            return;

        var currentContract = await _contractRepo.GetByIdAsync(contractId);
        if (currentContract == null) return;
        var approvedMonthlyPayment = extension.ProposedMonthlyPayment ?? currentContract.MonthlyPayment;

        await _contractRepo.ApplyExtensionAsync(contractId, extension.DurationMonths, approvedMonthlyPayment);
        extension.MarkCompleted();
        await _extensionRepo.UpdateAsync(extension);
    }

    /// <summary>
    /// Create warehouse membership for renter with RENTER role.
    /// If membership already exists, skip creation.
    /// </summary>
    private async Task CreateRenterMembershipAsync(int renterId, int warehouseId, CancellationToken cancellationToken)
    {
        try
        {
            // Check if membership already exists
            var existingMembership = await _membershipRepo.GetCallerMembershipAsync(renterId, warehouseId, cancellationToken);
            if (existingMembership != null)
            {
                _logger.LogInformation("Renter {RenterId} already has membership {MembershipId} in warehouse {WarehouseId}",
                    renterId, existingMembership.MembershipId, warehouseId);
                return;
            }

            // Create new membership with RENTER role
            var membershipDto = new CreateMembershipDto
            {
                UserId = renterId,
                WarehouseId = warehouseId,
                RoleCode = "RENTER",
                IsAllSkill = true, // Renter has all skills
                SkillIds = new List<int>(),
                WarehouseShiftId = null
            };

            var membershipId = await _membershipRepo.CreateMembershipAsync(membershipDto, cancellationToken);
            _logger.LogInformation("Created RENTER membership {MembershipId} for user {RenterId} in warehouse {WarehouseId}",
                membershipId, renterId, warehouseId);
        }
        catch (Exception ex)
        {
            // Log but don't fail the payment confirmation
            _logger.LogWarning(ex, "Failed to create RENTER membership for user {RenterId} in warehouse {WarehouseId}. Error: {Error}",
                renterId, warehouseId, ex.Message);
        }
    }

    private async Task DeductWarehouseAreaAsync(WMS.Domain.Entities.RentalContract contract, WMS.Domain.Entities.Warehouse? warehouse)
    {
        try
        {
            var rentalRequest = await _rentalRequestRepo.GetByIdAsync(contract.RentalRequestId);
            if (rentalRequest == null || warehouse == null) return;

            // Module 2/5: Guard - AvailableArea không được âm
            var newAvailable = warehouse.AvailableArea - rentalRequest.RequestedArea;
            if (newAvailable < 0)
            {
                _logger.LogWarning(
                    "Deduct area would make AvailableArea negative for warehouse {WarehouseId}. Clamping to 0. Available={Available}, Requested={Requested}",
                    warehouse.WarehouseId, warehouse.AvailableArea, rentalRequest.RequestedArea);
                newAvailable = 0;
            }
            warehouse.AvailableArea = newAvailable;
            await _warehouseRepo.UpdateAsync(warehouse, CancellationToken.None);

            _logger.LogInformation(
                "Deducted {Area}m² from warehouse {WarehouseId}. New available: {Available}m²",
                rentalRequest.RequestedArea, warehouse.WarehouseId, warehouse.AvailableArea);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to deduct warehouse area for contract {ContractId}", contract.ContractId);
        }
    }
}

