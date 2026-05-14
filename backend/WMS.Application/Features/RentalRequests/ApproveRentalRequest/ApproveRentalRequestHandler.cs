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
    private readonly IEmailService _emailService;

    public ApproveRentalRequestHandler(
        IRentalRequestRepository rentalRequestRepository,
        IRentalContractRepository contractRepository,
        IWarehouseRepository warehouseRepository,
        INotificationRepository notificationRepository,
        INotificationSender notificationSender,
        IUserRepository userRepository,
        IPdfService pdfService,
        IEmailService emailService)
    {
        _rentalRequestRepository = rentalRequestRepository;
        _contractRepository = contractRepository;
        _warehouseRepository = warehouseRepository;
        _notificationRepository = notificationRepository;
        _notificationSender = notificationSender;
        _userRepository = userRepository;
        _pdfService = pdfService;
        _emailService = emailService;
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
            // Bypassed for new simplified architecture - no longer require zone selection to approve contract
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

            // Create contract with DRAFT status
            Console.WriteLine($"[DEBUG] Creating contract - MonthlyPayment: {request.MonthlyPayment}, StartDate: {request.StartDate}, DurationMonths: {request.DurationMonths}");

            var contract = RentalContract.CreateFromRequest(
                rentalRequest,
                request.MonthlyPayment,
                request.DepositAmount,
                request.Terms,
                request.StartDate,
                request.DurationMonths,
                request.MonthsPerTerm,
                request.AllowedOverdueDays
            );

            Console.WriteLine($"[DEBUG] Contract created in memory - Status: {contract.Status}");

            var contractId = await _contractRepository.AddAsync(contract);
            Console.WriteLine($"[DEBUG] Contract saved to DB - ContractId: {contractId}");

            var renter = await _userRepository.GetByIdAsync(rentalRequest.RenterId, cancellationToken);
            if (renter != null && !string.IsNullOrWhiteSpace(renter.Email))
            {
                var subject = $"Yêu cầu thuê kho đã được chấp nhận - {warehouse.Name}";
                var contractLink = $"http://localhost:3000/contracts/{contractId}?tab=negotiation";
                var htmlContent = $@"
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;'>
    <h2 style='color: #16a34a; text-align: center;'>Yêu cầu thuê kho đã được chấp nhận</h2>
    <p>Xin chào <strong>{renter.FullName}</strong>,</p>
    <p>Chủ kho đã chấp nhận yêu cầu thuê kho <strong>{warehouse.Name}</strong> của bạn. Bản nháp hợp đồng đã được tạo.</p>
    <div style='background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 16px 0;'>
        <h3 style='margin-top: 0; color: #374151;'>Thông tin hợp đồng:</h3>
        <ul style='color: #4b5563; line-height: 1.6;'>
            <li><strong>Mã hợp đồng:</strong> {contract.ContractNumber}</li>
            <li><strong>Kho:</strong> {warehouse.Name}</li>
            <li><strong>Giá thuê/tháng:</strong> {contract.MonthlyPayment:N0} VNĐ</li>
            <li><strong>Tiền đặt cọc:</strong> {contract.DepositAmount:N0} VNĐ</li>
            <li><strong>Thời hạn:</strong> {request.DurationMonths} tháng</li>
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
