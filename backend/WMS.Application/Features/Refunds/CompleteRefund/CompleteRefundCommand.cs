using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Refunds.CompleteRefund;

public class CompleteRefundCommand : IRequest<CompleteRefundResult>
{
    public int RefundId { get; set; }
    public bool IsApproved { get; set; }
    public string? RejectionReason { get; set; }
    public int ProcessedBy { get; set; }
}

public class CompleteRefundResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = null!;
}

public class CompleteRefundHandler : IRequestHandler<CompleteRefundCommand, CompleteRefundResult>
{
    private readonly IRefundRepository _refundRepository;
    private readonly INotificationRepository _notificationRepository;
    private readonly IEmailService _emailService;

    public CompleteRefundHandler(
        IRefundRepository refundRepository,
        INotificationRepository notificationRepository,
        IEmailService emailService)
    {
        _refundRepository = refundRepository;
        _notificationRepository = notificationRepository;
        _emailService = emailService;
    }

    public async Task<CompleteRefundResult> Handle(CompleteRefundCommand request, CancellationToken cancellationToken)
    {
        var refund = await _refundRepository.GetByIdWithDetailsAsync(request.RefundId);

        if (refund == null)
        {
            return new CompleteRefundResult
            {
                Success = false,
                Message = "Không tìm thấy yêu cầu hoàn tiền"
            };
        }

        if (refund.Status != "PENDING" && refund.Status != "PROCESSING")
        {
            return new CompleteRefundResult
            {
                Success = false,
                Message = $"Không thể xử lý yêu cầu hoàn tiền với trạng thái {refund.Status}"
            };
        }

        if (request.IsApproved)
        {
            refund.MarkCompleted();
            await _refundRepository.UpdateAsync(refund);

            // Notify renter
            var notification = Notification.Create(
                receiverUserId: refund.Contract!.RenterId,
                title: "Hoàn tiền đã được xử lý",
                message: $"Yêu cầu hoàn tiền {refund.Amount:N0} VNĐ cho hợp đồng {refund.Contract.ContractNumber} đã được xử lý thành công.",
                notificationType: "IN_APP",
                referenceId: refund.RefundId,
                referenceType: "Refund"
            );
            await _notificationRepository.AddAsync(notification);

            // Send email
            if (refund.Contract.Renter != null)
            {
                try
                {
                    await _emailService.SendInfo(
                        refund.Contract.Renter.Email,
                        refund.Contract.Renter.FullName,
                        "Hoàn tiền đã được xử lý - OWRMS",
                        $@"<p>Xin chào {refund.Contract.Renter.FullName},</p>
                           <p>Yêu cầu hoàn tiền <strong>{refund.Amount:N0} VNĐ</strong> cho hợp đồng <strong>{refund.Contract.ContractNumber}</strong> đã được xử lý thành công.</p>
                           <p>Tiền sẽ được chuyển vào tài khoản của bạn trong 3-5 ngày làm việc.</p>"
                    );
                }
                catch { /* Log warning but don't fail */ }
            }
        }
        else
        {
            refund.MarkFailed();
            await _refundRepository.UpdateAsync(refund);

            var notification = Notification.Create(
                receiverUserId: refund.Contract!.RenterId,
                title: "Yêu cầu hoàn tiền bị từ chối",
                message: $"Yêu cầu hoàn tiền cho hợp đồng {refund.Contract.ContractNumber} đã bị từ chối. Lý do: {request.RejectionReason}",
                notificationType: "IN_APP",
                referenceId: refund.RefundId,
                referenceType: "Refund"
            );
            await _notificationRepository.AddAsync(notification);
        }

        return new CompleteRefundResult
        {
            Success = true,
            Message = request.IsApproved 
                ? "Đã xử lý hoàn tiền thành công" 
                : "Đã từ chối yêu cầu hoàn tiền"
        };
    }
}
