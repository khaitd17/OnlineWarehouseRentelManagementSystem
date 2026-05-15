using MediatR;
using WMS.Domain.Exceptions;
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
    private readonly IUserRepository _userRepository;
    private readonly IEmailService _emailService;

    public RejectRentalRequestHandler(
        IRentalRequestRepository rentalRequestRepository,
        IWarehouseRepository warehouseRepository,
        INotificationRepository notificationRepository,
        INotificationSender notificationSender,
        IUserRepository userRepository,
        IEmailService emailService)
    {
        _rentalRequestRepository = rentalRequestRepository;
        _warehouseRepository = warehouseRepository;
        _notificationRepository = notificationRepository;
        _notificationSender = notificationSender;
        _userRepository = userRepository;
        _emailService = emailService;
    }

    public async Task<Unit> Handle(RejectRentalRequestCommand request, CancellationToken cancellationToken)
    {
        // Get rental request
        var rentalRequest = await _rentalRequestRepository.GetByIdAsync(request.RequestId);
        if (rentalRequest == null)
            throw new NotFoundException("Rental request not found");

        // Verify reviewer is the warehouse owner
        var warehouse = await _warehouseRepository.GetByIdAsync(rentalRequest.WarehouseId, cancellationToken);
        if (warehouse == null)
            throw new NotFoundException("Warehouse not found");

        if (warehouse.OwnerId != request.ReviewerId)
            throw new UnauthorizedException("Only warehouse owner can reject requests");

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

        var renter = await _userRepository.GetByIdAsync(rentalRequest.RenterId, cancellationToken);
        if (renter != null && !string.IsNullOrWhiteSpace(renter.Email))
        {
            try
            {
                var subject = $"Yêu cầu thuê kho đã bị từ chối - {warehouse.Name}";
                var requestLink = $"http://localhost:3000/rental-request/{rentalRequest.RequestId}";
                var htmlContent = $@"
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;'>
    <h2 style='color: #dc2626; text-align: center;'>Yêu cầu thuê kho bị từ chối</h2>
    <p>Xin chào <strong>{renter.FullName}</strong>,</p>
    <p>Yêu cầu thuê kho <strong>{warehouse.Name}</strong> của bạn đã bị từ chối.</p>
    <div style='background-color: #fef2f2; padding: 15px; border-radius: 6px; margin: 16px 0;'>
        <p style='margin: 0; color: #991b1b;'><strong>Lý do:</strong> {request.RejectionReason}</p>
    </div>
    <div style='margin-top: 24px; text-align: center;'>
        <a href='{requestLink}' style='background-color: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;'>Xem chi tiết yêu cầu</a>
    </div>
    <hr style='border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;' />
    <p style='font-size: 12px; color: #9ca3af; text-align: center;'>Đây là email tự động từ hệ thống OWRMS. Vui lòng không trả lời email này.</p>
</div>";

                await _emailService.SendInfo(renter.Email, renter.FullName, subject, htmlContent);
            }
            catch
            {
                // Không chặn luồng từ chối yêu cầu nếu gửi email thất bại
            }
        }

        return Unit.Value;
    }
}
