using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalRequests.ApproveRentalRequest;

public class ApproveRentalRequestHandler : IRequestHandler<ApproveRentalRequestCommand, int>
{
    private readonly IRentalRequestRepository _rentalRequestRepository;
    private readonly IRentalContractRepository _contractRepository;
    private readonly IWarehouseRepository _warehouseRepository;
    private readonly INotificationRepository _notificationRepository;
    private readonly INotificationSender _notificationSender;
    private readonly IUserRepository _userRepository;
    private readonly IPdfService _pdfService;

    public ApproveRentalRequestHandler(
        IRentalRequestRepository rentalRequestRepository,
        IRentalContractRepository contractRepository,
        IWarehouseRepository warehouseRepository,
        INotificationRepository notificationRepository,
        INotificationSender notificationSender,
        IUserRepository userRepository,
        IPdfService pdfService)
    {
        _rentalRequestRepository = rentalRequestRepository;
        _contractRepository = contractRepository;
        _warehouseRepository = warehouseRepository;
        _notificationRepository = notificationRepository;
        _notificationSender = notificationSender;
        _userRepository = userRepository;
        _pdfService = pdfService;
    }

    public async Task<int> Handle(ApproveRentalRequestCommand request, CancellationToken cancellationToken)
    {
        var rentalRequest = await _rentalRequestRepository.GetByIdAsync(request.RequestId)
            ?? throw new InvalidOperationException("Rental request not found");

        var warehouse = await _warehouseRepository.GetByIdAsync(rentalRequest.WarehouseId, cancellationToken)
            ?? throw new InvalidOperationException("Warehouse not found");

        if (warehouse.OwnerId != request.ReviewerId)
            throw new UnauthorizedAccessException("Only warehouse owner can approve requests");

        // Idempotency: if request is already approved, find or resume existing contract
        if (rentalRequest.Status == "APPROVED")
        {
            var existingContract = await _contractRepository.GetByRentalRequestIdAsync(request.RequestId);
            if (existingContract != null)
            {
                // If contract has no PDF yet, try to generate it now
                if (string.IsNullOrEmpty(existingContract.ContractFileUrl))
                {
                    await TryGenerateAndUpdatePdf(existingContract, rentalRequest, warehouse, cancellationToken);
                }
                return existingContract.ContractId;
            }
            // Contract doesn't exist yet (very rare edge case) — fall through to create it
        }
        else
        {
            if (warehouse.AvailableArea < rentalRequest.RequestedArea)
                throw new InvalidOperationException("Warehouse no longer has enough available area");

            rentalRequest.Approve(request.ReviewerId, request.ContractImageUrl);
            await _rentalRequestRepository.UpdateAsync(rentalRequest);
        }

        // Create contract with DRAFT status (waiting for renter to sign)
        var contract = RentalContract.CreateFromRequest(
            rentalRequest,
            request.MonthlyPayment,
            request.DepositAmount,
            request.Terms
        );
        var contractId = await _contractRepository.AddAsync(contract);

        // Deduct approved area from warehouse available area (done before PDF so it always commits)
        warehouse.AvailableArea -= rentalRequest.RequestedArea;
        await _warehouseRepository.UpdateAsync(warehouse, cancellationToken);

        // Update the domain contract object with the generated ID for later use
        var contractIdProp = typeof(RentalContract).GetProperty("ContractId");
        contractIdProp?.SetValue(contract, contractId);

        // Generate contract PDF — wrapped so a failure doesn't abort the whole operation
        await TryGenerateAndUpdatePdf(contract, rentalRequest, warehouse, cancellationToken);

        // Send notification to renter
        var notification = new Notification
        {
            UserId = rentalRequest.RenterId,
            Title = "Yêu cầu thuê kho đã được duyệt",
            Message = $"Yêu cầu thuê kho {warehouse.Name} đã được duyệt. Hợp đồng #{contract.ContractNumber} đã được tạo.",
            Type = "CONTRACT_APPROVED",
            ReferenceId = contractId,
            ReferenceType = "CONTRACT"
        };
        await _notificationRepository.AddAsync(notification);
        await _notificationSender.SendToUserAsync(rentalRequest.RenterId, notification);

        return contractId;
    }

    private async Task TryGenerateAndUpdatePdf(
        RentalContract contract,
        RentalRequest rentalRequest,
        Warehouse warehouse,
        CancellationToken cancellationToken)
    {
        try
        {
            var renter = await _userRepository.GetByIdAsync(rentalRequest.RenterId, cancellationToken);
            var owner = await _userRepository.GetByIdAsync(warehouse.OwnerId, cancellationToken);

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

            var pdfUrl = await _pdfService.GenerateContractPdfAsync(pdfData);
            contract.SetContractFileUrl(pdfUrl);
            await _contractRepository.UpdateAsync(contract);
        }
        catch
        {
            // PDF generation is non-critical; contract is already created
            // The renter can still sign; PDF can be regenerated later
        }
    }
}
