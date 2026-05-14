using MediatR;
using WMS.Domain.Exceptions;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalRequests.CreateRentalRequest;

public class CreateRentalRequestHandler : IRequestHandler<CreateRentalRequestCommand, int>
{
    private readonly IRentalRequestRepository _rentalRequestRepository;
    private readonly IWarehouseRepository _warehouseRepository;
    private readonly IUserRepository _userRepository;
    private readonly INotificationRepository _notificationRepository;
    private readonly INotificationSender _notificationSender;
    private readonly IEquipmentRepository _equipmentRepository;
    private readonly IEmailService _emailService;

    public CreateRentalRequestHandler(
        IRentalRequestRepository rentalRequestRepository,
        IWarehouseRepository warehouseRepository,
        IUserRepository userRepository,
        INotificationRepository notificationRepository,
        INotificationSender notificationSender,
        IEquipmentRepository equipmentRepository,
        IEmailService emailService)
    {
        _rentalRequestRepository = rentalRequestRepository;
        _warehouseRepository = warehouseRepository;
        _userRepository = userRepository;
        _notificationRepository = notificationRepository;
        _notificationSender = notificationSender;
        _equipmentRepository = equipmentRepository;
        _emailService = emailService;
    }

    public async Task<int> Handle(CreateRentalRequestCommand request, CancellationToken cancellationToken)
    {
        // ── Module 2: Rental Request Business Validation ────────────────────────
        // Ngày bắt đầu không được trong quá khứ
        var today = DateTime.UtcNow.Date;
        if (request.StartDate.Date < today)
            throw new ArgumentException("Ngày bắt đầu thuê không được là ngày trong quá khứ.");

        // Thời hạn thuê: 1 - 120 tháng
        if (request.DurationMonths < 1 || request.DurationMonths > 120)
            throw new ArgumentException("Thời hạn thuê phải từ 1 đến 120 tháng.");

        // Diện tích yêu cầu phải dương
        if (request.RequestedArea <= 0)
            throw new ArgumentException("Diện tích yêu cầu phải lớn hơn 0.");

        // Ghi chú không quá 1000 ký tự
        if (!string.IsNullOrEmpty(request.Notes) && request.Notes.Length > 1000)
            throw new ArgumentException("Ghi chú không được vượt quá 1000 ký tự.");
        // ────────────────────────────────────────────────────────────────────

        // Validate warehouse exists and has enough available area
        var warehouse = await _warehouseRepository.GetByIdAsync(request.WarehouseId, cancellationToken);
        if (warehouse == null)
            throw new InvalidOperationException("Warehouse not found");

        if (warehouse.Status != "APPROVED")
            throw new InvalidWarehouseStateException("Warehouse is not available for rental");

        if (warehouse.AvailableArea < request.RequestedArea)
            throw new NotEnoughAreaException($"Warehouse does not have enough available area. Available: {warehouse.AvailableArea}, Requested: {request.RequestedArea}");

        // If specific area is requested, check equipment status
        if (request.RentalAreaId.HasValue)
        {
            var areaEquipments = await _equipmentRepository.GetByRentalAreaIdAsync(request.RentalAreaId.Value, cancellationToken);
            var brokenOrMaintenance = areaEquipments.Where(e => e.Status == "BROKEN" || e.Status == "MAINTENANCE").ToList();
            
            if (brokenOrMaintenance.Any())
            {
                // Strict mode: Fail request if equipment is broken/maintenance
                throw new InvalidOperationException($"Cannot rent this area because it contains equipment that is BROKEN or in MAINTENANCE. ({brokenOrMaintenance.Count} items)");
            }
        }

        // Check if user already has pending request for this warehouse
        var hasPending = await _rentalRequestRepository.HasPendingRequestAsync(request.RenterId, request.WarehouseId);
        if (hasPending)
            throw new DuplicateRequestException("Bạn đã có yêu cầu thuê đang chờ xử lý với kho này.");

        // Create rental request
        var rentalRequest = RentalRequest.Create(
            request.RenterId,
            request.WarehouseId,
            request.RequestedArea,
            request.StartDate,
            request.DurationMonths,
            request.Notes
        );
        rentalRequest.RentalAreaId = request.RentalAreaId;

        // Persist custom-area data if the renter drew their own zone
        if (request.IsCustomArea)
        {
            rentalRequest.IsCustomArea      = true;
            rentalRequest.ProposedPositionX = request.ProposedPositionX;
            rentalRequest.ProposedPositionY = request.ProposedPositionY;
            rentalRequest.ProposedWidth     = request.ProposedWidth;
            rentalRequest.ProposedLength    = request.ProposedLength;
            rentalRequest.BaseRentalAreaId  = request.BaseRentalAreaId;

            // L-shaped extension zone
            if (request.HasExtensionZone)
            {
                rentalRequest.HasExtensionZone    = true;
                rentalRequest.ExtensionPositionX  = request.ExtensionPositionX;
                rentalRequest.ExtensionPositionY  = request.ExtensionPositionY;
                rentalRequest.ExtensionWidth      = request.ExtensionWidth;
                rentalRequest.ExtensionLength     = request.ExtensionLength;
            }

            // Multi-zone: additional non-adjacent rectangles
            if (!string.IsNullOrWhiteSpace(request.AdditionalZonesJson))
            {
                rentalRequest.AdditionalZonesJson = request.AdditionalZonesJson;
            }
        }

        var requestId = await _rentalRequestRepository.AddAsync(rentalRequest);

        // Get renter info for notification
        var renter = await _userRepository.GetByIdAsync(request.RenterId, cancellationToken);
        var renterName = renter?.FullName ?? "Người thuê";

        // Send notification to warehouse owner
        var notification = new Notification
        {
            UserId = warehouse.OwnerId,
            Title = "Yêu cầu thuê kho mới",
            Message = $"{renterName} đã gửi yêu cầu thuê kho {warehouse.Name}. diện tích: {request.RequestedArea}m², Thời hạn: {request.DurationMonths} tháng.",
            Type = "RENTAL_REQUEST_RECEIVED",
            ReferenceId = requestId,
            ReferenceType = "RENTAL_REQUEST"
        };
        await _notificationRepository.AddAsync(notification);
        await _notificationSender.SendToUserAsync(warehouse.OwnerId, notification);

        var owner = await _userRepository.GetByIdAsync(warehouse.OwnerId, cancellationToken);
        if (owner != null && !string.IsNullOrWhiteSpace(owner.Email))
        {
            var subject = $"Yêu cầu thuê kho mới - {warehouse.Name}";
            var requestLink = $"http://localhost:3000/rental-request/{requestId}";
            var htmlContent = $@"
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;'>
    <h2 style='color: #2563eb; text-align: center;'>Yêu cầu thuê kho mới</h2>
    <p>Xin chào <strong>{owner.FullName}</strong>,</p>
    <p>Bạn vừa nhận được một yêu cầu thuê kho mới từ <strong>{renterName}</strong>.</p>
    <div style='background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 16px 0;'>
        <h3 style='margin-top: 0; color: #374151;'>Thông tin yêu cầu:</h3>
        <ul style='color: #4b5563; line-height: 1.6;'>
            <li><strong>Mã yêu cầu:</strong> #{requestId}</li>
            <li><strong>Kho:</strong> {warehouse.Name}</li>
            <li><strong>Diện tích:</strong> {request.RequestedArea} m²</li>
            <li><strong>Thời hạn:</strong> {request.DurationMonths} tháng</li>
            <li><strong>Ngày bắt đầu:</strong> {request.StartDate:dd/MM/yyyy}</li>
            {(string.IsNullOrWhiteSpace(request.Notes) ? "" : $"<li><strong>Ghi chú:</strong> {request.Notes}</li>")}
        </ul>
    </div>
    <div style='margin-top: 24px; text-align: center;'>
        <a href='{requestLink}' style='background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;'>Xem chi tiết yêu cầu</a>
    </div>
    <hr style='border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;' />
    <p style='font-size: 12px; color: #9ca3af; text-align: center;'>Đây là email tự động từ hệ thống OWRMS. Vui lòng không trả lời email này.</p>
</div>";

            await _emailService.SendInfo(owner.Email, owner.FullName, subject, htmlContent);
        }

        return requestId;
    }
}

