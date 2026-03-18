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
        try
        {
            Console.WriteLine($"[DEBUG] ApproveRentalRequest - RequestId: {request.RequestId}, ReviewerId: {request.ReviewerId}");

            var rentalRequest = await _rentalRequestRepository.GetByIdAsync(request.RequestId)
                ?? throw new InvalidOperationException("Rental request not found");

            Console.WriteLine($"[DEBUG] RentalRequest found - Status: {rentalRequest.Status}, WarehouseId: {rentalRequest.WarehouseId}");

            var warehouse = await _warehouseRepository.GetByIdAsync(rentalRequest.WarehouseId, cancellationToken)
                ?? throw new InvalidOperationException("Warehouse not found");

            Console.WriteLine($"[DEBUG] Warehouse found - OwnerId: {warehouse.OwnerId}, AvailableArea: {warehouse.AvailableArea}");

            if (warehouse.OwnerId != request.ReviewerId)
                throw new UnauthorizedAccessException("Only warehouse owner can approve requests");

            // Idempotency: if request is already approved, find or resume existing contract
            var wasAlreadyApproved = rentalRequest.Status == "APPROVED";
            Console.WriteLine($"[DEBUG] wasAlreadyApproved: {wasAlreadyApproved}");

            if (wasAlreadyApproved)
            {
                var existingContract = await _contractRepository.GetByRentalRequestIdAsync(request.RequestId);
                if (existingContract != null)
                {
                    Console.WriteLine($"[DEBUG] Existing contract found - ContractId: {existingContract.ContractId}");
                    return existingContract.ContractId;
                }
                // Contract doesn't exist yet (very rare edge case) — fall through to create it
            }

            // Check available area before proceeding
            if (warehouse.AvailableArea < rentalRequest.RequestedArea)
                throw new InvalidOperationException("Warehouse no longer has enough available area");

            // Approve request if not already approved
            if (!wasAlreadyApproved)
            {
                Console.WriteLine($"[DEBUG] Approving request...");
                rentalRequest.Approve(request.ReviewerId, request.ContractImageUrl);
                await _rentalRequestRepository.UpdateAsync(rentalRequest);
                Console.WriteLine($"[DEBUG] Request approved - New status: {rentalRequest.Status}");
            }

            // Create contract with PENDING_OWNER_SIGNATURE status
            Console.WriteLine($"[DEBUG] Creating contract - MonthlyPayment: {request.MonthlyPayment}, StartDate: {request.StartDate}, DurationMonths: {request.DurationMonths}");

            var contract = RentalContract.CreateFromRequest(
                rentalRequest,
                request.MonthlyPayment,
                request.DepositAmount,
                request.Terms,
                request.StartDate,
                request.DurationMonths
            );

            Console.WriteLine($"[DEBUG] Contract created in memory - Status: {contract.Status}");

            var contractId = await _contractRepository.AddAsync(contract);
            Console.WriteLine($"[DEBUG] Contract saved to DB - ContractId: {contractId}");

            // Deduct approved area from warehouse available area (only if not already deducted)
            if (!wasAlreadyApproved)
            {
                Console.WriteLine($"[DEBUG] Deducting area - Before: {warehouse.AvailableArea}, Requested: {rentalRequest.RequestedArea}");
                warehouse.AvailableArea -= rentalRequest.RequestedArea;
                await _warehouseRepository.UpdateAsync(warehouse, cancellationToken);
                Console.WriteLine($"[DEBUG] Area deducted - After: {warehouse.AvailableArea}");
            }

            // Update the domain contract object with the generated ID for later use
            var contractIdProp = typeof(RentalContract).GetProperty("ContractId");
            contractIdProp?.SetValue(contract, contractId);

            // Note: PDF generation and notification will happen after owner signs the contract
            // Contract is created with status PENDING_OWNER_SIGNATURE

            Console.WriteLine($"[DEBUG] ApproveRentalRequest completed successfully - ContractId: {contractId}");
            return contractId;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERROR] ApproveRentalRequest failed - Exception: {ex.GetType().Name}");
            Console.WriteLine($"[ERROR] Message: {ex.Message}");
            Console.WriteLine($"[ERROR] StackTrace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"[ERROR] InnerException: {ex.InnerException.Message}");
                Console.WriteLine($"[ERROR] InnerException StackTrace: {ex.InnerException.StackTrace}");
            }
            throw;
        }
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
