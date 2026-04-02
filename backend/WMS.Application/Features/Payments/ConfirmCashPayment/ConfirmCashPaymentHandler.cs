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

    public ConfirmCashPaymentHandler(
        IRentalPaymentRepository paymentRepo,
        IRentalContractRepository contractRepo,
        IWarehouseRepository warehouseRepo,
        INotificationRepository notificationRepo,
        INotificationSender notificationSender,
        IStaffMembershipRepository membershipRepo,
        ILogger<ConfirmCashPaymentHandler> logger)
    {
        _paymentRepo = paymentRepo;
        _contractRepo = contractRepo;
        _warehouseRepo = warehouseRepo;
        _notificationRepo = notificationRepo;
        _notificationSender = notificationSender;
        _membershipRepo = membershipRepo;
        _logger = logger;
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

        if (request.IsApproved)
        {
            // Complete the payment
            payment.Status = PaymentStatus.Completed;

            // Activate the contract
            if (contract.Status == RentalContractStatus.PendingPayment)
            {
                contract.ActivateAfterPayment();
            }
            else
            {
                // Force activate for any other status (e.g. when owner confirms cash payment)
                contract.ForceActivate();
            }

            await _paymentRepo.UpdateAsync(payment);
            await _contractRepo.UpdateAsync(contract);

            // Create warehouse membership for renter (Quản lý kho role)
            await CreateRenterMembershipAsync(contract.RenterId, contract.WarehouseId, cancellationToken);

            // Send notification to renter
            var notification = new Notification
            {
                UserId = contract.RenterId,
                Title = "🎉 Thanh toán đã được xác nhận",
                Message = $"Chủ kho đã xác nhận thanh toán tiền mặt cho hợp đồng {contract.ContractNumber}. Hợp đồng đã được kích hoạt! Bạn giờ đã có quyền quản lý kho.",
                Type = "PAYMENT_CONFIRMED",
                ReferenceId = contract.ContractId,
                ReferenceType = "CONTRACT",
                CreatedAt = DateTime.UtcNow
            };

            await _notificationRepo.AddAsync(notification);
            await _notificationSender.SendToUserAsync(contract.RenterId, notification);

            _logger.LogInformation("Cash payment {PaymentId} confirmed by owner {OwnerId}. Renter {RenterId} granted RENTER role for warehouse {WarehouseId}", 
                request.PaymentId, request.OwnerId, contract.RenterId, contract.WarehouseId);

            return new ConfirmCashPaymentResult
            {
                Success = true,
                Message = "Đã xác nhận thanh toán thành công. Hợp đồng đã được kích hoạt và người thuê đã được cấp quyền quản lý kho.",
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
}
