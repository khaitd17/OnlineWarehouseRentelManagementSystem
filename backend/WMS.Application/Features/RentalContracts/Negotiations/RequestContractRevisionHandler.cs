using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Enums;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalContracts.Negotiations;

public class RequestContractRevisionHandler : IRequestHandler<RequestContractRevisionCommand, RequestContractRevisionResult>
{
    private readonly IRentalContractRepository _contractRepo;
    private readonly IWarehouseRepository _warehouseRepo;
    private readonly IContractRevisionThreadRepository _threadRepo;
    private readonly IContractRevisionCommentRepository _commentRepo;
    private readonly INotificationRepository _notificationRepo;
    private readonly INotificationSender _notificationSender;
    private readonly IUserRepository _userRepository;
    private readonly IEmailService _emailService;

    public RequestContractRevisionHandler(
        IRentalContractRepository contractRepo,
        IWarehouseRepository warehouseRepo,
        IContractRevisionThreadRepository threadRepo,
        IContractRevisionCommentRepository commentRepo,
        INotificationRepository notificationRepo,
        INotificationSender notificationSender,
        IUserRepository userRepository,
        IEmailService emailService)
    {
        _contractRepo = contractRepo;
        _warehouseRepo = warehouseRepo;
        _threadRepo = threadRepo;
        _commentRepo = commentRepo;
        _notificationRepo = notificationRepo;
        _notificationSender = notificationSender;
        _userRepository = userRepository;
        _emailService = emailService;
    }

    public async Task<RequestContractRevisionResult> Handle(RequestContractRevisionCommand request, CancellationToken cancellationToken)
    {
        var contract = await _contractRepo.GetByIdAsync(request.ContractId)
            ?? throw new InvalidOperationException("Contract not found");

        var warehouse = await _warehouseRepo.GetByIdAsync(contract.WarehouseId, cancellationToken);

        if (contract.RenterId != request.UserId)
            throw new UnauthorizedAccessException("Only renter can request revision");

        if (contract.Status != RentalContractStatus.Negotiating &&
            contract.Status != RentalContractStatus.RevisionRequested)
        {
            throw new InvalidOperationException($"Cannot request revision for contract with status {contract.Status}");
        }

        if (string.IsNullOrWhiteSpace(request.Message))
            throw new ArgumentException("Message is required");

        if (string.IsNullOrWhiteSpace(request.Section))
            throw new ArgumentException("Section is required");

        var thread = new ContractRevisionThread
        {
            ContractId = contract.ContractId,
            Section = request.Section,
            Status = ContractRevisionStatus.Open,
            CreatedBy = request.UserId,
            CreatedAt = DateTime.UtcNow
        };
        var threadId = await _threadRepo.AddAsync(thread);

        var comment = new ContractRevisionComment
        {
            ThreadId = threadId,
            UserId = request.UserId,
            Message = request.Message,
            CreatedAt = DateTime.UtcNow
        };
        await _commentRepo.AddAsync(comment);

        contract.RequestRevision();
        await _contractRepo.UpdateAsync(contract);

        if (warehouse != null)
        {
            var sectionVietnamese = (request.Section?.ToLowerInvariant()?.Trim()) switch
            {
                "rental price" => "Giá thuê",
                "deposit" => "Tiền đặt cọc",
                "payment terms" => "Điều khoản thanh toán",
                "contract terms" => "Điều khoản hợp đồng",
                "violation terms" => "Điều khoản hợp đồng",
                "termination terms" => "Điều khoản hợp đồng",
                "other" => "Khác",
                _ => request.Section
            };

            var notification = Notification.Create(
                receiverUserId: warehouse.OwnerId,
                title: "Yêu cầu chỉnh sửa hợp đồng",
                message: $"Người thuê yêu cầu chỉnh sửa mục {sectionVietnamese} trong hợp đồng {contract.ContractNumber}.",
                notificationType: "CONTRACT_REVISION_REQUESTED",
                referenceId: contract.ContractId,
                referenceType: "CONTRACT");
            await _notificationRepo.AddAsync(notification);
            // Fire-and-forget: SignalR push không block response
            _ = Task.Run(async () =>
            {
                try { await _notificationSender.SendToUserAsync(warehouse.OwnerId, notification); }
                catch { /* non-critical */ }
            });

            var owner = await _userRepository.GetByIdAsync(warehouse.OwnerId, cancellationToken);
            if (owner != null && !string.IsNullOrWhiteSpace(owner.Email))
            {
                var subject = $"Yêu cầu chỉnh sửa hợp đồng - {contract.ContractNumber}";
                var contractLink = $"http://localhost:3000/contracts/{contract.ContractId}?tab=negotiation";
                var htmlContent = $@"
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;'>
    <h2 style='color: #f59e0b; text-align: center;'>Yêu cầu chỉnh sửa hợp đồng</h2>
    <p>Xin chào <strong>{owner.FullName}</strong>,</p>
    <p>Người thuê đã yêu cầu chỉnh sửa hợp đồng <strong>{contract.ContractNumber}</strong>.</p>
    <div style='background-color: #fffbeb; padding: 15px; border-radius: 6px; margin: 16px 0; border-left: 4px solid #f59e0b;'>
        <p style='margin: 0; color: #92400e;'><strong>Mục chỉnh sửa:</strong> {sectionVietnamese}</p>
        <p style='margin: 8px 0 0 0; color: #92400e;'><strong>Nội dung:</strong> {request.Message}</p>
    </div>
    <div style='margin-top: 24px; text-align: center;'>
        <a href='{contractLink}' style='background-color: #f59e0b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;'>Xem và phản hồi</a>
    </div>
    <hr style='border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;' />
    <p style='font-size: 12px; color: #9ca3af; text-align: center;'>Đây là email tự động từ hệ thống OWRMS. Vui lòng không trả lời email này.</p>
</div>";

                // Gửi email chạy nền (fire-and-forget) để tránh làm tắc nghẽn HTTP request chính, giúp phản hồi UI cực nhanh
                _ = Task.Run(async () =>
                {
                    try
                    {
                        await _emailService.SendInfo(owner.Email, owner.FullName, subject, htmlContent);
                    }
                    catch (Exception ex)
                    {
                        System.Diagnostics.Debug.WriteLine($"Error sending contract revision request email in background: {ex.Message}");
                    }
                });
            }
        }

        return new RequestContractRevisionResult
        {
            ThreadId = threadId,
            Status = contract.Status
        };
    }
}
