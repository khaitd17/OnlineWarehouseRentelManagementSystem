using MediatR;
using WMS.Domain.Entities;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalRequests.CancelRentalRequest;

public class CancelRentalRequestHandler : IRequestHandler<CancelRentalRequestCommand, Unit>
{
    private readonly IRentalRequestRepository _repository;
    private readonly ICancellationLogRepository _cancellationLogRepository;
    private readonly INotificationRepository _notificationRepository;

    public CancelRentalRequestHandler(
        IRentalRequestRepository repository,
        ICancellationLogRepository cancellationLogRepository,
        INotificationRepository notificationRepository)
    {
        _repository = repository;
        _cancellationLogRepository = cancellationLogRepository;
        _notificationRepository = notificationRepository;
    }

    public async Task<Unit> Handle(CancelRentalRequestCommand request, CancellationToken cancellationToken)
    {
        var rentalRequest = await _repository.GetByIdAsync(request.RequestId);
        if (rentalRequest == null)
            throw new InvalidOperationException("Rental request not found");

        if (rentalRequest.RenterId != request.RenterId)
            throw new UnauthorizedAccessException("Only the renter can cancel this request");

        // Enhanced: Cancel with reason
        var defaultReason = "Người thuê hủy yêu cầu";
        var cancellationReason = string.IsNullOrWhiteSpace(request.CancellationReason) 
            ? defaultReason 
            : request.CancellationReason;

        rentalRequest.CancelWithReason(cancellationReason, "USER");
        await _repository.UpdateAsync(rentalRequest);

        // Log cancellation
        var cancellationLog = CancellationLog.Create(
            rentalRequestId: rentalRequest.RequestId,
            rentalContractId: null,
            cancelledStage: "PENDING",
            cancelledBy: "USER",
            cancellationReason: cancellationReason,
            refundAmount: null,
            cancellationFee: null
        );
        await _cancellationLogRepository.AddAsync(cancellationLog);

        // Send notification to warehouse owner
        var notification = Notification.Create(
            receiverUserId: rentalRequest.Warehouse.OwnerId,
            title: "Yêu cầu thuê kho đã bị hủy",
            message: $"Người thuê đã hủy yêu cầu thuê kho {rentalRequest.Warehouse.Name}. Lý do: {cancellationReason}",
            notificationType: "IN_APP",
            referenceId: rentalRequest.RequestId,
            referenceType: "RentalRequest"
        );
        await _notificationRepository.AddAsync(notification);

        return Unit.Value;
    }
}
