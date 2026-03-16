using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalRequests.RejectRentalRequest;

public class RejectRentalRequestHandler : IRequestHandler<RejectRentalRequestCommand, Unit>
{
    private readonly IRentalRequestRepository _rentalRequestRepository;
    private readonly IWarehouseRepository _warehouseRepository;
    private readonly INotificationRepository _notificationRepository;
    private readonly INotificationSender _notificationSender;

    public RejectRentalRequestHandler(
        IRentalRequestRepository rentalRequestRepository,
        IWarehouseRepository warehouseRepository,
        INotificationRepository notificationRepository,
        INotificationSender notificationSender)
    {
        _rentalRequestRepository = rentalRequestRepository;
        _warehouseRepository = warehouseRepository;
        _notificationRepository = notificationRepository;
        _notificationSender = notificationSender;
    }

    public async Task<Unit> Handle(RejectRentalRequestCommand request, CancellationToken cancellationToken)
    {
        // Get rental request
        var rentalRequest = await _rentalRequestRepository.GetByIdAsync(request.RequestId);
        if (rentalRequest == null)
            throw new InvalidOperationException("Rental request not found");

        // Verify reviewer is the warehouse owner
        var warehouse = await _warehouseRepository.GetByIdAsync(rentalRequest.WarehouseId, cancellationToken);
        if (warehouse == null)
            throw new InvalidOperationException("Warehouse not found");

        if (warehouse.OwnerId != request.ReviewerId)
            throw new UnauthorizedAccessException("Only warehouse owner can reject requests");

        // Reject rental request (domain method)
        rentalRequest.Reject(request.ReviewerId, request.RejectionReason);
        await _rentalRequestRepository.UpdateAsync(rentalRequest);

        // Send notification to renter
        var notification = new Notification
        {
            UserId = rentalRequest.RenterId,
            Title = "Yêu cầu thuê kho đã bị từ chối",
            Message = $"Yêu cầu thuê kho {warehouse.Name} đã bị từ chối. Lý do: {request.RejectionReason}",
            Type = "CONTRACT_REJECTED",
            ReferenceId = rentalRequest.RequestId,
            ReferenceType = "RENTAL_REQUEST"
        };
        await _notificationRepository.AddAsync(notification);
        await _notificationSender.SendToUserAsync(rentalRequest.RenterId, notification);

        return Unit.Value;
    }
}
