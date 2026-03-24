using MediatR;
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
        // Validate warehouse exists and has enough available area
        var warehouse = await _warehouseRepository.GetByIdAsync(request.WarehouseId, cancellationToken);
        if (warehouse == null)
            throw new InvalidOperationException("Warehouse not found");

        if (warehouse.Status != "APPROVED")
            throw new InvalidOperationException("Warehouse is not available for rental");

        if (warehouse.AvailableArea < request.RequestedArea)
            throw new InvalidOperationException($"Warehouse does not have enough available area. Available: {warehouse.AvailableArea}, Requested: {request.RequestedArea}");

        // If specific area is requested, check equipment status
        if (request.RentalAreaId.HasValue)
        {
            var areaEquipments = await _equipmentRepository.GetByRentalAreaIdAsync(request.RentalAreaId.Value, cancellationToken);
            var brokenOrMaintenance = areaEquipments.Where(e => e.Status == "BROKEN" || e.Status == "MAINTENANCE").ToList();
            
            if (brokenOrMaintenance.Any())
            {
                // Strict mode: Fail request if equipment is broken/maintenance
                throw new InvalidOperationException($"Cannot rent this area because it contains equipment that is BROKEN or in MAINTENANCE. ({brokenOrMaintenance.Count} items)");
                
                // Note: Flexible mode would just be a warning in the response, but this is a command (Action)
            }
        }

        // Check if user already has pending request for this warehouse
        var hasPending = await _rentalRequestRepository.HasPendingRequestAsync(request.RenterId, request.WarehouseId);
        if (hasPending)
            throw new InvalidOperationException("You already have a pending request for this warehouse");

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

        var requestId = await _rentalRequestRepository.AddAsync(rentalRequest);

        // Get renter info for notification
        var renter = await _userRepository.GetByIdAsync(request.RenterId, cancellationToken);
        var renterName = renter?.FullName ?? "Người thuê";

        // Send notification to warehouse owner
        var notification = new Notification
        {
            UserId = warehouse.OwnerId,
            Title = "Yêu cầu thuê kho mới",
            Message = $"{renterName} đã gửi yêu cầu thuê kho {warehouse.Name}. Diện tích: {request.RequestedArea}m², Thời hạn: {request.DurationMonths} tháng.",
            Type = "RENTAL_REQUEST_RECEIVED",
            ReferenceId = requestId,
            ReferenceType = "RENTAL_REQUEST"
        };
        await _notificationRepository.AddAsync(notification);
        await _notificationSender.SendToUserAsync(warehouse.OwnerId, notification);

        return requestId;
    }
}
