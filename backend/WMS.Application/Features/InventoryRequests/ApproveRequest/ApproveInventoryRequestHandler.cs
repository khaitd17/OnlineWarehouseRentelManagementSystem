using MediatR;
using WMS.Application.Features.InventoryRequests.Shared;
using WMS.Domain.Interfaces;
using WMS.Application.Interfaces;

namespace WMS.Application.Features.InventoryRequests.ApproveRequest;

// ─── Command ─────────────────────────────────────────────────────────────────
public record ApproveInventoryRequestCommand : IRequest<InventoryRequestDto>
{
    public int     Id        { get; init; }
    public int     ManagerId { get; init; }
    public string? Note      { get; init; }
    public string? Role      { get; init; }
    public string? ManagerSignatureBase64 { get; init; }
}

// ─── Handler ─────────────────────────────────────────────────────────────────
public class ApproveInventoryRequestHandler
    : IRequestHandler<ApproveInventoryRequestCommand, InventoryRequestDto>
{
    private readonly IInventoryRequestRepository _repo;
    private readonly ITaskRepository _taskRepo;
    private readonly IEmailService _emailService;
    private readonly IInventoryRequestStaffNotifier _staffNotifier;

    public ApproveInventoryRequestHandler(
        IInventoryRequestRepository repo,
        ITaskRepository taskRepo,
        IEmailService emailService,
        IInventoryRequestStaffNotifier staffNotifier)
    {
        _repo         = repo;
        _taskRepo     = taskRepo;
        _emailService = emailService;
        _staffNotifier = staffNotifier;
    }

    public async Task<InventoryRequestDto> Handle(
        ApproveInventoryRequestCommand cmd, CancellationToken cancellationToken)
    {
        var req = await _repo.GetByIdAsync(cmd.Id, cancellationToken)
            ?? throw new KeyNotFoundException($"Request {cmd.Id} not found.");

        if (req.Status != "PENDING" && req.Status != "CONFIRMED")
            throw new InvalidOperationException(
                $"Chỉ có thể tiếp nhận yêu cầu đang ở trạng thái Chờ tiếp nhận hoặc Đã tiếp nhận. Trạng thái hiện tại: '{req.Status}'.");

        var previousStatus = req.Status;
        req.Status      = "CONFIRMED";
        req.ConfirmedBy = cmd.ManagerId;
        req.ConfirmedAt = DateTime.Now;
        req.UpdatedAt   = DateTime.Now;
        
        if (!string.IsNullOrEmpty(cmd.ManagerSignatureBase64))
        {
            req.ManagerSignatureBase64 = cmd.ManagerSignatureBase64;
        }

        // Ghi chú phê duyệt (append vào Notes nếu có)
        if (!string.IsNullOrWhiteSpace(cmd.Note))
        {
            var rolePrefix = cmd.Role == "OWNER" ? "Chủ kho" : "Nhân viên";
            req.Notes = string.IsNullOrEmpty(req.Notes)
                ? $"{rolePrefix}: {cmd.Note}"
                : $"{rolePrefix}: {cmd.Note}\n{req.Notes}";
        }

        await _repo.UpdateAsync(req, cancellationToken);

        // Gửi email thông báo cho người thuê
        if (req.Renter != null && !string.IsNullOrEmpty(req.Renter.Email))
        {
            var subject = req.Type == "INBOUND" 
                ? $"✅ Yêu cầu nhập kho #{req.InvReqId} đã được phê duyệt"
                : $"✅ Yêu cầu xuất kho #{req.InvReqId} đã được phê duyệt";

            var reqTypeStr = req.Type == "INBOUND" ? "nhập kho" : "xuất kho";
            var actionStr = req.Type == "INBOUND" 
                ? "vận chuyển hàng hóa tới kho để lưu kho" 
                : "sắp xếp xe đến kho để lấy hàng";

            var requestCodeStr = req.RequestCode ?? $"#{req.InvReqId}";
            var confirmedAtStr = req.ConfirmedAt?.ToString("dd/MM/yyyy HH:mm") ?? DateTime.Now.ToString("dd/MM/yyyy HH:mm");
            var noteHtml = string.IsNullOrWhiteSpace(cmd.Note) ? "" : $"<li><strong>Ghi chú từ quản lý:</strong> {cmd.Note}</li>";

            var htmlContent = $@"
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;'>
    <h2 style='color: #16a34a; text-align: center;'>Yêu cầu {reqTypeStr} đã được phê duyệt!</h2>
    <p>Xin chào <strong>{req.Renter.FullName}</strong>,</p>
    <p>Chúng tôi xin thông báo yêu cầu {reqTypeStr} mã <strong>{requestCodeStr}</strong> của bạn tại kho <strong>{req.Warehouse?.Name}</strong> đã được Quản lý kho phê duyệt thành công.</p>
    
    <div style='background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;'>
        <h3 style='margin-top: 0; color: #374151;'>Thông tin chi tiết:</h3>
        <ul style='color: #4b5563; line-height: 1.6;'>
            <li><strong>Mã yêu cầu:</strong> {requestCodeStr}</li>
            <li><strong>Kho xử lý:</strong> {req.Warehouse?.Name}</li>
            <li><strong>Thời gian duyệt:</strong> {confirmedAtStr}</li>
            {noteHtml}
        </ul>
    </div>

    <p style='color: #1f2937; font-weight: bold;'>Bước tiếp theo:</p>
    <p>Bạn có thể tiến hành <strong>{actionStr}</strong> theo thời gian đã dự kiến. Đội ngũ nhân viên kho của chúng tôi đã sẵn sàng hỗ trợ bạn.</p>

    <div style='margin-top: 30px; text-align: center;'>
        <a href='http://localhost:3000/renter-inventory-history' style='background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;'>Xem chi tiết yêu cầu</a>
    </div>
    
    <hr style='border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;' />
    <p style='font-size: 12px; color: #9ca3af; text-align: center;'>Đây là email tự động từ hệ thống OWRMS. Vui lòng không trả lời email này.</p>
</div>";

            try 
            {
                await _emailService.SendInfo(req.Renter.Email, req.Renter.FullName, subject, htmlContent);
            } 
            catch { /* Bỏ qua lỗi gửi email để không chặn luồng chính */ }
        }

        // Đóng UnitTask tương ứng với bước duyệt đơn
        var approveCode = req.Type == "OUTBOUND"
            ? "OUTBOUND_APPROVE"
            : "INBOUND_APPROVE";
        try { await _taskRepo.CompleteUnitTaskAsync(req.Type, req.InvReqId, approveCode, cmd.ManagerId, cancellationToken); }
        catch { /* Task không tìm thấy — không chặn nghiệp vụ */ }

        var updated = await _repo.GetByIdAsync(req.InvReqId, cancellationToken);
        if (previousStatus == "PENDING")
        {
            await _staffNotifier.NotifyReadyForProcessingAsync(updated!, cancellationToken);
        }

        return InventoryRequestMapper.ToDto(updated!);
    }
}
