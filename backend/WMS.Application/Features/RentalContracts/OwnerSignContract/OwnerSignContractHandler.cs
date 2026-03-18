using MediatR;
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

    public OwnerSignContractHandler(
        IRentalContractRepository contractRepo,
        IWarehouseRepository warehouseRepo,
        IUserRepository userRepo,
        IPdfService pdfService,
        INotificationRepository notificationRepo,
        INotificationSender notificationSender)
    {
        _contractRepo = contractRepo;
        _warehouseRepo = warehouseRepo;
        _userRepo = userRepo;
        _pdfService = pdfService;
        _notificationRepo = notificationRepo;
        _notificationSender = notificationSender;
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
            Terms = contract.Terms
        };

        // Generate PDF with owner signature embedded
        var ownerSignedFileUrl = await _pdfService.GenerateContractPdfAsync(pdfData, request.SignatureBase64);

        // Update contract domain
        contract.OwnerSign(ownerSignedFileUrl, request.SignatureBase64);
        await _contractRepo.UpdateAsync(contract);

        // Send notification to renter
        var notification = new Notification
        {
            UserId = contract.RenterId,
            Title = "Hợp đồng thuê kho đã được gửi đến bạn",
            Message = $"Chủ kho đã ký và gửi hợp đồng thuê kho {warehouse.Name} đến bạn. Hợp đồng #{contract.ContractNumber} đang chờ bạn xem xét và ký.",
            Type = "CONTRACT_SENT",
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
}
