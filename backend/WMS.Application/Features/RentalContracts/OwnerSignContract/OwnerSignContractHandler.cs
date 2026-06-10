using MediatR;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalContracts.OwnerSignContract;

public class OwnerSignContractHandler : IRequestHandler<OwnerSignContractCommand, OwnerSignContractResult>
{
    private readonly IRentalContractRepository _contractRepo;
    private readonly IWarehouseRepository _warehouseRepo;
    private readonly IUserRepository _userRepo;
    private readonly IPdfService _pdfService;
    private readonly INotificationRepository _notificationRepo;
    private readonly INotificationSender _notificationSender;
    private readonly IRentalRequestRepository _rentalRequestRepo;
    private readonly IEquipmentRepository _equipmentRepo;
    private readonly IRentalPaymentRepository _paymentRepo;
    private readonly IStaffMembershipRepository _membershipRepo;
    private readonly ILogger<OwnerSignContractHandler> _logger;

    public OwnerSignContractHandler(
        IRentalContractRepository contractRepo,
        IWarehouseRepository warehouseRepo,
        IUserRepository userRepo,
        IPdfService pdfService,
        INotificationRepository notificationRepo,
        INotificationSender notificationSender,
        IRentalRequestRepository rentalRequestRepo,
        IEquipmentRepository equipmentRepo,
        IRentalPaymentRepository paymentRepo,
        IStaffMembershipRepository membershipRepo,
        ILogger<OwnerSignContractHandler> logger)
    {
        _contractRepo = contractRepo;
        _warehouseRepo = warehouseRepo;
        _userRepo = userRepo;
        _pdfService = pdfService;
        _notificationRepo = notificationRepo;
        _notificationSender = notificationSender;
        _rentalRequestRepo = rentalRequestRepo;
        _equipmentRepo = equipmentRepo;
        _paymentRepo = paymentRepo;
        _membershipRepo = membershipRepo;
        _logger = logger;
    }

    public async Task<OwnerSignContractResult> Handle(OwnerSignContractCommand request, CancellationToken cancellationToken)
    {
        var contract = await _contractRepo.GetByIdAsync(request.ContractId)
            ?? throw new InvalidOperationException("Contract not found");

        var warehouse = await _warehouseRepo.GetByIdAsync(contract.WarehouseId, cancellationToken)
            ?? throw new InvalidOperationException("Warehouse not found");

        if (warehouse.OwnerId != request.OwnerId)
            throw new UnauthorizedAccessException("Only warehouse owner can sign the contract");

        if (contract.Status != "PENDING_OWNER_SIGNATURE")
            throw new InvalidOperationException($"Cannot owner-sign contract with status {contract.Status}");

        // Generate PDF with owner signature
        var renter = await _userRepo.GetByIdAsync(contract.RenterId, cancellationToken);
        var owner = await _userRepo.GetByIdAsync(warehouse.OwnerId, cancellationToken);

        var pdfData = new ContractPdfData
        {
            ContractId = contract.ContractId,
            ContractNumber = contract.ContractNumber,
            RenterName = renter?.FullName ?? "Unknown",
            RenterEmail = renter?.Email ?? "",
            OwnerName = owner?.FullName ?? "Unknown",
            WarehouseName = warehouse.Name ?? "",
            WarehouseAddress = warehouse.Address ?? "",
            StartDate = contract.StartDate,
            EndDate = contract.EndDate,
            MonthlyPayment = contract.MonthlyPayment,
            TotalValue = contract.TotalValue,
            DepositAmount = contract.DepositAmount,
            Terms = contract.Terms,
            OwnerSignatureBase64 = request.SignatureBase64,  // Chữ ký chủ kho
            RenterSignatureBase64 = contract.RenterSignatureBase64 // Lấy chữ ký Renter đã ký trước đó
        };

        // Generate PDF with both signatures embedded
        var ownerSignedFileUrl = await _pdfService.GenerateContractPdfAsync(pdfData);

        // Update contract domain
        contract.OwnerSign(ownerSignedFileUrl, request.SignatureBase64); // Chuyển status thành ACTIVE
        await _contractRepo.UpdateAsync(contract);

        // Grant RENTER membership in the warehouse so the renter can use warehouse features
        await CreateRenterMembershipAsync(contract.RenterId, contract.WarehouseId, cancellationToken);

        // Sinh hóa đơn (Bill)
        var fullContractInfo = await _contractRepo.GetByIdWithDetailsAsync(contract.ContractId);
        
        int monthsPerTerm = fullContractInfo?.PaymentTerm?.MonthsPerTerm ?? 1;
        int overdueDays = fullContractInfo?.PaymentTerm?.AllowedOverdueDays ?? 7;

        var firstTermEndDate = contract.StartDate.AddMonths(monthsPerTerm);
        decimal proratedAmount;

        if (firstTermEndDate > contract.EndDate)
        {
            firstTermEndDate = contract.EndDate;
            var termDays = (firstTermEndDate - contract.StartDate).Days;
            proratedAmount = (contract.MonthlyPayment / 30m) * termDays;
        }
        else
        {
            proratedAmount = contract.MonthlyPayment * monthsPerTerm;
        }
        
        // If contract starts within 5 days or in the past, create bill now
        if ((contract.StartDate - DateTime.UtcNow).TotalDays <= 5)
        {
            decimal totalInitialAmount = Math.Round(proratedAmount, 2) + (contract.DepositAmount ?? 0);
            
            var payment = RentalPayment.Create(
                contractId: contract.ContractId,
                amount: totalInitialAmount,
                paymentType: contract.DepositAmount > 0 ? "DEPOSIT" : "MONTHLY",
                expiryHours: overdueDays * 24,
                termStartDate: contract.StartDate,
                termEndDate: firstTermEndDate
            );
            await _paymentRepo.AddAsync(payment);
            await _paymentRepo.SaveChangesAsync();
            payment.SetPaymentCode();
            await _paymentRepo.UpdatePaymentCodeAsync(payment.PaymentId, payment.PaymentCode);
        }

        // Cập nhật trạng thái Equipments thành IN_USE
        var fullContract = await _contractRepo.GetWithEquipmentsByIdAsync(contract.ContractId);
        var equipmentIdsToUpdate = new HashSet<int>();

        // 1. Add explicitly included equipments
        if (fullContract?.IncludedEquipments != null && fullContract.IncludedEquipments.Any())
        {
            foreach (var e in fullContract.IncludedEquipments)
                equipmentIdsToUpdate.Add(e.EquipmentId);
        }

        // 2. Add equipments from the rented area/warehouse automatically
        var rentalRequest = await _rentalRequestRepo.GetByIdAsync(contract.RentalRequestId);
        if (rentalRequest != null)
        {
            var autoEquipments = new List<Equipment>();
            
            if (rentalRequest.RentalAreaId.HasValue)
            {
                var areaEquipments = await _equipmentRepo.GetByRentalAreaIdAsync(rentalRequest.RentalAreaId.Value, cancellationToken);
                autoEquipments.AddRange(areaEquipments);
            }

            var warehouseEquipments = await _equipmentRepo.GetByWarehouseIdAsync(contract.WarehouseId, cancellationToken);
            var sharedEquipments = warehouseEquipments.Where(e => e.RentalAreaId == null);
            autoEquipments.AddRange(sharedEquipments);

            foreach (var e in autoEquipments)
            {
                if (e.Status == "AVAILABLE")
                {
                    equipmentIdsToUpdate.Add(e.EquipmentId);
                }
            }
        }

        if (equipmentIdsToUpdate.Any())
        {
            var idList = equipmentIdsToUpdate.ToList();
            await _contractRepo.AssignEquipmentsAsync(contract.ContractId, idList, cancellationToken);
            await _equipmentRepo.UpdateStatusesAsync(idList, "IN_USE", cancellationToken);
            
            foreach (var eqId in idList)
            {
                await _equipmentRepo.AddHistoryAsync(new EquipmentHistory
                {
                    EquipmentId = eqId,
                    PreviousStatus = "AVAILABLE",
                    NewStatus = "IN_USE",
                    ContractId = contract.ContractId,
                    Note = $"Equipment automatically assigned to active contract {contract.ContractNumber}"
                }, cancellationToken);
            }
        }

        // Send notification to renter
        var notification = new Notification
        {
            UserId = contract.RenterId,
            Title = "Hợp đồng đã hoàn tất và kích hoạt",
            Message = $"Chủ kho đã ký hợp đồng {contract.ContractNumber}. Hợp đồng hiện đã ACTIVE. Vui lòng thanh toán hóa đơn kỳ đầu tiên (nếu có).",
            Type = "CONTRACT_ACTIVE",
            ReferenceId = contract.ContractId,
            ReferenceType = "CONTRACT"
        };
        await _notificationRepo.AddAsync(notification);
        await _notificationSender.SendToUserAsync(contract.RenterId, notification);

        return new OwnerSignContractResult
        {
            OwnerSignedFileUrl = ownerSignedFileUrl,
            Status = contract.Status
        };
    }

    /// <summary>
    /// Create warehouse membership for renter with RENTER role.
    /// If membership already exists, skip creation. Non-fatal on error.
    /// </summary>
    private async Task CreateRenterMembershipAsync(int renterId, int warehouseId, CancellationToken cancellationToken)
    {
        try
        {
            var existingMembership = await _membershipRepo.GetCallerMembershipAsync(renterId, warehouseId, cancellationToken);
            if (existingMembership != null)
            {
                _logger.LogInformation("Renter {RenterId} already has membership in warehouse {WarehouseId} — skipped",
                    renterId, warehouseId);
                return;
            }

            var membershipDto = new CreateMembershipDto
            {
                UserId = renterId,
                WarehouseId = warehouseId,
                RoleCode = "RENTER",
                IsAllSkill = true,
                SkillIds = new List<int>(),
                WarehouseShiftId = null
            };

            var membershipId = await _membershipRepo.CreateMembershipAsync(membershipDto, cancellationToken);
            _logger.LogInformation("Created RENTER membership {MembershipId} for user {RenterId} in warehouse {WarehouseId} via OwnerSign",
                membershipId, renterId, warehouseId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to create RENTER membership for user {RenterId} in warehouse {WarehouseId} via OwnerSign",
                renterId, warehouseId);
        }
    }
}
