using MediatR;
using System.Collections.Generic;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalContracts.SignContract;

public class SignContractHandler : IRequestHandler<SignContractCommand, SignContractResult>
{
    private readonly IRentalContractRepository _contractRepo;
    private readonly IContractLogRepository _logRepo;
    private readonly IPdfService _pdfService;
    private readonly INotificationRepository _notificationRepo;
    private readonly INotificationSender _notificationSender;
    private readonly IWarehouseRepository _warehouseRepo;
    private readonly IUserRepository _userRepo;
    private readonly IRentalRequestRepository _rentalRequestRepo;
    private readonly IEquipmentRepository _equipmentRepo;
    private readonly IRentalPaymentRepository _paymentRepo;

    public SignContractHandler(
        IRentalContractRepository contractRepo,
        IContractLogRepository logRepo,
        IPdfService pdfService,
        INotificationRepository notificationRepo,
        INotificationSender notificationSender,
        IWarehouseRepository warehouseRepo,
        IUserRepository userRepo,
        IRentalRequestRepository rentalRequestRepo,
        IEquipmentRepository equipmentRepo,
        IRentalPaymentRepository paymentRepo)
    {
        _contractRepo = contractRepo;
        _logRepo = logRepo;
        _pdfService = pdfService;
        _notificationRepo = notificationRepo;
        _notificationSender = notificationSender;
        _warehouseRepo = warehouseRepo;
        _userRepo = userRepo;
        _rentalRequestRepo = rentalRequestRepo;
        _equipmentRepo = equipmentRepo;
        _paymentRepo = paymentRepo;
    }

    public async Task<SignContractResult> Handle(SignContractCommand request, CancellationToken cancellationToken)
    {
        var contract = await _contractRepo.GetByIdAsync(request.ContractId)
            ?? throw new InvalidOperationException("Contract not found");

        if (contract.RenterId != request.UserId)
            throw new UnauthorizedAccessException("Only the renter can sign the contract");

        if (contract.Status != "PENDING_RENTER_SIGNATURE")
            throw new InvalidOperationException($"Cannot sign contract with status {contract.Status}");

        // Tạo PDF đã ký trong một bước duy nhất (tránh lỗi khi mở lại PDF)
        var warehouse = await _warehouseRepo.GetByIdAsync(contract.WarehouseId, cancellationToken);
        var renter = await _userRepo.GetByIdAsync(contract.RenterId, cancellationToken);
        var owner = warehouse != null ? await _userRepo.GetByIdAsync(warehouse.OwnerId, cancellationToken) : null;

        var pdfData = new ContractPdfData
        {
            ContractId = contract.ContractId,
            ContractNumber = contract.ContractNumber,
            RenterName = renter?.FullName ?? "Unknown",
            RenterEmail = renter?.Email ?? "",
            OwnerName = owner?.FullName ?? "Unknown",
            WarehouseName = warehouse?.Name ?? "",
            WarehouseAddress = warehouse?.Address ?? "",
            StartDate = contract.StartDate,
            EndDate = contract.EndDate,
            MonthlyPayment = contract.MonthlyPayment,
            TotalValue = contract.TotalValue,
            DepositAmount = contract.DepositAmount,
            Terms = contract.Terms,
            OwnerSignatureBase64 = contract.OwnerSignatureBase64,  // Chữ ký chủ kho đã ký trước đó
            RenterSignatureBase64 = request.SignatureBase64         // Chữ ký người thuê
        };

        // Tạo PDF với CẢ HAI chữ ký (owner + renter)
        var signedFileUrl = await _pdfService.GenerateContractPdfAsync(pdfData);

        // Update contract domain
        contract.SetContractFileUrl(signedFileUrl);
        contract.Sign(signedFileUrl, request.SignatureBase64);  // Status -> ACTIVE
        contract.ForceActivate(); // Ensures it bypasses PENDING_PAYMENT if any previous logic set it
        await _contractRepo.UpdateAsync(contract);

        // Generate the first bill based on PaymentTerm (pro-rated if needed)
        // Fetch full contract to get PaymentTerm
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
                expiryHours: overdueDays * 24
            );
            await _paymentRepo.AddAsync(payment);
            await _paymentRepo.SaveChangesAsync();
            payment.SetPaymentCode();
            await _paymentRepo.UpdatePaymentCodeAsync(payment.PaymentId, payment.PaymentCode);
        }

        // Update Equipments to IN_USE
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
            
            // Lấy thiết bị của khu vực thuê (nếu có)
            if (rentalRequest.RentalAreaId.HasValue)
            {
                var areaEquipments = await _equipmentRepo.GetByRentalAreaIdAsync(rentalRequest.RentalAreaId.Value, cancellationToken);
                autoEquipments.AddRange(areaEquipments);
            }

            // Lấy thêm các thiết bị Dùng Chung Toàn Kho (RentalAreaId == null)
            var warehouseEquipments = await _equipmentRepo.GetByWarehouseIdAsync(contract.WarehouseId, cancellationToken);
            var sharedEquipments = warehouseEquipments.Where(e => e.RentalAreaId == null);
            autoEquipments.AddRange(sharedEquipments);

            foreach (var e in autoEquipments)
            {
                // Only auto-include equipments that are actually available
                if (e.Status == "AVAILABLE")
                {
                    equipmentIdsToUpdate.Add(e.EquipmentId);
                }
            }
        }

        if (equipmentIdsToUpdate.Any())
        {
            var idList = equipmentIdsToUpdate.ToList();
            
            // Map the link in the database first
            await _contractRepo.AssignEquipmentsAsync(contract.ContractId, idList, cancellationToken);
            
            // Update statuses to IN_USE
            await _equipmentRepo.UpdateStatusesAsync(idList, "IN_USE", cancellationToken);
            
            // Log equipment history
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

        // Log
        await _logRepo.AddAsync(new ContractLog
        {
            ContractId = request.ContractId,
            UserId = request.UserId,
            Action = "CONTRACT_SIGNED",
            IpAddress = request.IpAddress,
            Details = "Contract signed electronically"
        });

        // Send notification to renter about pending payment
        var notification = new Notification
        {
            UserId = contract.RenterId,
            Title = "Hop dong da duoc ky - Vui long thanh toan",
            Message = $"Hop dong {contract.ContractNumber} da duoc ky thanh cong. Vui long thanh toan trong vong 24 giờ de kich hoat hop dong.",
            Type = "CONTRACT_SIGNED",
            ReferenceId = contract.ContractId,
            ReferenceType = "CONTRACT"
        };
        await _notificationRepo.AddAsync(notification);
        await _notificationSender.SendToUserAsync(contract.RenterId, notification);

        // Send notification to owner
        if (warehouse != null && owner != null)
        {
            var ownerNotification = new Notification
            {
                UserId = warehouse.OwnerId,
                Title = "Hop dong da duoc ky - Cho thanh toan",
                Message = $"Hop dong {contract.ContractNumber} da duoc ky boi nguoi thue. Dang cho thanh toan.",
                Type = "CONTRACT_SIGNED",
                ReferenceId = contract.ContractId,
                ReferenceType = "CONTRACT"
            };
            await _notificationRepo.AddAsync(ownerNotification);
            await _notificationSender.SendToUserAsync(warehouse.OwnerId, ownerNotification);
        }

        return new SignContractResult
        {
            SignedFileUrl = signedFileUrl,
            Status = contract.Status
        };
    }
}
