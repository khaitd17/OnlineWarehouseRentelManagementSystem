using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalContracts.SignContract;

public class SignContractHandler : IRequestHandler<SignContractCommand, SignContractResult>
{
    private readonly IRentalContractRepository _contractRepo;
    private readonly IContractVerificationRepository _verificationRepo;
    private readonly IContractLogRepository _logRepo;
    private readonly IPdfService _pdfService;
    private readonly INotificationRepository _notificationRepo;
    private readonly INotificationSender _notificationSender;
    private readonly IWarehouseRepository _warehouseRepo;
    private readonly IUserRepository _userRepo;
    private readonly IRentalRequestRepository _rentalRequestRepo;

    public SignContractHandler(
        IRentalContractRepository contractRepo,
        IContractVerificationRepository verificationRepo,
        IContractLogRepository logRepo,
        IPdfService pdfService,
        INotificationRepository notificationRepo,
        INotificationSender notificationSender,
        IWarehouseRepository warehouseRepo,
        IUserRepository userRepo,
        IRentalRequestRepository rentalRequestRepo)
    {
        _contractRepo = contractRepo;
        _verificationRepo = verificationRepo;
        _logRepo = logRepo;
        _pdfService = pdfService;
        _notificationRepo = notificationRepo;
        _notificationSender = notificationSender;
        _warehouseRepo = warehouseRepo;
        _userRepo = userRepo;
        _rentalRequestRepo = rentalRequestRepo;
    }

    public async Task<SignContractResult> Handle(SignContractCommand request, CancellationToken cancellationToken)
    {
        var contract = await _contractRepo.GetByIdAsync(request.ContractId)
            ?? throw new InvalidOperationException("Contract not found");

        if (contract.RenterId != request.UserId)
            throw new UnauthorizedAccessException("Only the renter can sign the contract");

        if (contract.Status != "PENDING_SIGNATURE")
            throw new InvalidOperationException($"Cannot sign contract with status {contract.Status}");

        // Verify OTP was completed
        var verification = await _verificationRepo.GetLatestByContractAndUserAsync(request.ContractId, request.UserId)
            ?? throw new InvalidOperationException("OTP verification required before signing");

        if (!verification.IsVerified)
            throw new InvalidOperationException("OTP not verified. Please verify OTP first.");

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
        contract.Sign(signedFileUrl);
        await _contractRepo.UpdateAsync(contract);

        // Log
        await _logRepo.AddAsync(new ContractLog
        {
            ContractId = request.ContractId,
            UserId = request.UserId,
            Action = "CONTRACT_SIGNED",
            IpAddress = request.IpAddress,
            Details = "Contract signed electronically"
        });

        // Send notification to renter
        var notification = new Notification
        {
            UserId = contract.RenterId,
            Title = "Hop dong da duoc ky thanh cong",
            Message = $"Hop dong {contract.ContractNumber} da duoc ky thanh cong va chuyen sang trang thai ACTIVE.",
            Type = "CONTRACT_SIGNED",
            ReferenceId = contract.ContractId,
            ReferenceType = "CONTRACT"
        };
        await _notificationRepo.AddAsync(notification);
        await _notificationSender.SendToUserAsync(contract.RenterId, notification);

        return new SignContractResult
        {
            SignedFileUrl = signedFileUrl,
            Status = contract.Status
        };
    }
}
