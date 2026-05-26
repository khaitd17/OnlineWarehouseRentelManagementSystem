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

    public SignContractHandler(
        IRentalContractRepository contractRepo,
        IContractLogRepository logRepo,
        IPdfService pdfService,
        INotificationRepository notificationRepo,
        INotificationSender notificationSender,
        IWarehouseRepository warehouseRepo,
        IUserRepository userRepo)
    {
        _contractRepo = contractRepo;
        _logRepo = logRepo;
        _pdfService = pdfService;
        _notificationRepo = notificationRepo;
        _notificationSender = notificationSender;
        _warehouseRepo = warehouseRepo;
        _userRepo = userRepo;
    }

    public async Task<SignContractResult> Handle(SignContractCommand request, CancellationToken cancellationToken)
    {
        var contract = await _contractRepo.GetByIdAsync(request.ContractId)
            ?? throw new InvalidOperationException("Contract not found");

        if (contract.RenterId != request.UserId)
            throw new UnauthorizedAccessException("Only the renter can sign the contract");

        if (contract.Status != "NEGOTIATING" && contract.Status != "DRAFT" && contract.Status != "APPROVED_FOR_SIGNING")
            throw new InvalidOperationException($"Cannot sign contract with status {contract.Status}");

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
            OwnerSignatureBase64 = null, // Owner chưa ký
            RenterSignatureBase64 = request.SignatureBase64
        };

        // Tạo PDF với CẢ HAI chữ ký (owner = null)
        var signedFileUrl = await _pdfService.GenerateContractPdfAsync(pdfData);

        // Update contract domain
        contract.SetContractFileUrl(signedFileUrl);
        contract.Sign(signedFileUrl, request.SignatureBase64);  // Status -> PENDING_OWNER_SIGNATURE
        await _contractRepo.UpdateAsync(contract);

        // Log
        await _logRepo.AddAsync(new ContractLog
        {
            ContractId = request.ContractId,
            UserId = request.UserId,
            Action = "CONTRACT_SIGNED_BY_RENTER",
            IpAddress = request.IpAddress,
            Details = "Contract signed electronically by renter"
        });

        // Send notification to renter
        var notification = new Notification
        {
            UserId = contract.RenterId,
            Title = "Hợp đồng đã được ký",
            Message = $"Hợp đồng {contract.ContractNumber} đã được bạn ký thành công. Hệ thống đang chờ chủ kho xác nhận và ký hợp đồng.",
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
                Title = "Người thuê đã ký hợp đồng",
                Message = $"Hợp đồng {contract.ContractNumber} đã được người thuê ký. Vui lòng kiểm tra và tiến hành ký hợp đồng để kích hoạt.",
                Type = "CONTRACT_PENDING_OWNER_SIGNATURE",
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
