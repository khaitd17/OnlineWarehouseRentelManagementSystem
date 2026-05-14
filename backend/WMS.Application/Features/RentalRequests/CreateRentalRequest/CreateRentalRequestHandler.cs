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

    public CreateRentalRequestHandler(
        IRentalRequestRepository rentalRequestRepository,
        IWarehouseRepository warehouseRepository,
        IUserRepository userRepository,
        INotificationRepository notificationRepository,
        INotificationSender notificationSender,
        IEquipmentRepository equipmentRepository)
    {
        _rentalRequestRepository = rentalRequestRepository;
        _warehouseRepository = warehouseRepository;
        _userRepository = userRepository;
        _notificationRepository = notificationRepository;
        _notificationSender = notificationSender;
        _equipmentRepository = equipmentRepository;
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

        return requestId;
    }
}

