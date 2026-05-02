using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Domain.Exceptions;

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
                ?? throw new NotFoundException("Rental request not found");

            Console.WriteLine($"[DEBUG] RentalRequest found - Status: {rentalRequest.Status}, WarehouseId: {rentalRequest.WarehouseId}");

            var warehouse = await _warehouseRepository.GetByIdAsync(rentalRequest.WarehouseId, cancellationToken)
                ?? throw new NotFoundException("Warehouse not found");

            Console.WriteLine($"[DEBUG] Warehouse found - OwnerId: {warehouse.OwnerId}, AvailableArea: {warehouse.AvailableArea}");

            if (warehouse.OwnerId != request.ReviewerId)
                throw new UnauthorizedException("Only warehouse owner can approve requests");

            // ── Module 2: Approve Request Business Validation ────────────────
            if (request.MonthlyPayment <= 0)
                throw new ArgumentException("Tiền thuê hàng tháng phải lớn hơn 0.");
            if (request.DepositAmount < 0)
                throw new ArgumentException("Tiền đặt cọc không được âm.");
            if (request.DurationMonths < 1 || request.DurationMonths > 120)
                throw new ArgumentException("Thời hạn hợp đồng phải từ 1 đến 120 tháng.");
            var approveToday = DateTime.UtcNow.Date;
            if (request.StartDate.HasValue && request.StartDate.Value.Date < approveToday)
                throw new ArgumentException("Ngày bắt đầu hợp đồng không được là ngày trong quá khứ.");
            if (!string.IsNullOrEmpty(request.Terms) && request.Terms.Length > 5000)
                throw new ArgumentException("Nội dung điều khoản không được vượt quá 5000 ký tự.");
            // ───────────────────────────────────────────────────────────────────

            // Check if already approved or rejected
            if (rentalRequest.Status == "APPROVED" || rentalRequest.Status == "REJECTED")
            {
                throw new InvalidStateException($"Cannot approve request with status {rentalRequest.Status}");
            }

            // Check available area before proceeding
            if (warehouse.AvailableArea < rentalRequest.RequestedArea)
                throw new NotEnoughAreaException("Warehouse no longer has enough available area");

            // ── Module 3: Zone Assignment Validation ────────────────────────────
            // Ensure a valid zone exists before creating a contract.
            // A zone is considered valid if ANY of the following is true:
            //   1. Owner is assigning a new custom zone right now (AssignedWidth + AssignedLength).
            //   2. Renter already proposed a custom zone (ProposedWidth + ProposedLength).
            //   3. Renter selected a full existing RentalArea (RentalAreaId is set).
            bool ownerAssigningZone  = request.AssignedWidth.HasValue && request.AssignedLength.HasValue;
            bool renterProposedZone  = rentalRequest.ProposedWidth.HasValue && rentalRequest.ProposedLength.HasValue;
            bool renterSelectedArea  = rentalRequest.RentalAreaId.HasValue;

            if (!ownerAssigningZone && !renterProposedZone && !renterSelectedArea)
            {
                throw new ArgumentException(
                    "Vị trí khu vực thuê chưa được xác định. " +
                    "Vui lòng chỉ định vị trí cho người thuê trên sơ đồ kho trước khi duyệt hợp đồng.");
            }
            // ───────────────────────────────────────────────────────────────────

            // Approve request
            Console.WriteLine($"[DEBUG] Approving request...");
            rentalRequest.Approve(request.ReviewerId, request.ContractImageUrl);

            // Owner assigns zone (always allowed - overrides renter's proposed zone if needed)
            if (request.AssignedWidth.HasValue && request.AssignedLength.HasValue)
            {
                rentalRequest.IsCustomArea = true;
                rentalRequest.IsOwnerAssigned = true;
                rentalRequest.ProposedPositionX = request.AssignedPositionX;
                rentalRequest.ProposedPositionY = request.AssignedPositionY;
                rentalRequest.ProposedWidth = request.AssignedWidth;
                rentalRequest.ProposedLength = request.AssignedLength;
                rentalRequest.BaseRentalAreaId = request.AssignedBaseAreaId;
                if (request.AssignedHasExtensionZone)
                {
                    rentalRequest.HasExtensionZone = true;
                    rentalRequest.ExtensionPositionX = request.AssignedExtensionPositionX;
                    rentalRequest.ExtensionPositionY = request.AssignedExtensionPositionY;
                    rentalRequest.ExtensionWidth = request.AssignedExtensionWidth;
                    rentalRequest.ExtensionLength = request.AssignedExtensionLength;
                }
                // Multi-zone
                if (!string.IsNullOrWhiteSpace(request.AssignedAdditionalZonesJson))
                {
                    rentalRequest.AdditionalZonesJson = request.AssignedAdditionalZonesJson;
                }
                Console.WriteLine($"[DEBUG] Owner assigned zone: ({request.AssignedPositionX}, {request.AssignedPositionY}) {request.AssignedWidth}x{request.AssignedLength}");
            }

            await _rentalRequestRepository.UpdateAsync(rentalRequest);
            Console.WriteLine($"[DEBUG] Request approved - New status: {rentalRequest.Status}");

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

            // Note: AvailableArea is NOT deducted here — it will be deducted when the
            // contract becomes ACTIVE (after signing + payment confirmation).

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
