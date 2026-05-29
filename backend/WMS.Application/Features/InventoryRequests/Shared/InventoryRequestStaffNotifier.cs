using System.Net;
using Microsoft.Extensions.Logging;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.InventoryRequests.Shared;

public class InventoryRequestStaffNotifier : IInventoryRequestStaffNotifier
{
    private const string StaffRequestsUrl = "http://localhost:3000/staff-inventory-requests-staff";

    private readonly IStaffMembershipRepository _membershipRepository;
    private readonly IEmailService _emailService;
    private readonly ILogger<InventoryRequestStaffNotifier> _logger;

    public InventoryRequestStaffNotifier(
        IStaffMembershipRepository membershipRepository,
        IEmailService emailService,
        ILogger<InventoryRequestStaffNotifier> logger)
    {
        _membershipRepository = membershipRepository;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task NotifyReadyForProcessingAsync(
        InventoryRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.Status != "CONFIRMED")
            return;

        try
        {
            var recipients = await _membershipRepository
                .GetActiveWarehouseNotificationRecipientsAsync(request.WarehouseId, cancellationToken);

            if (recipients.Count == 0)
                return;

            var recipient = recipients[0];
            try
            {
                await _emailService.SendInfo(
                    recipient.Email,
                    recipient.FullName,
                    BuildSubject(request),
                    BuildBody(request, recipient.FullName));
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "Failed to send inventory request notification email to {Email} for request {RequestId}.",
                    recipient.Email,
                    request.InvReqId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Failed to notify warehouse staff for inventory request {RequestId}.",
                request.InvReqId);
        }
    }

    private static string BuildSubject(InventoryRequest request)
    {
        var typeText = request.Type == "INBOUND" ? "nhập kho" : "xuất kho";
        var requestCode = string.IsNullOrWhiteSpace(request.RequestCode)
            ? $"#{request.InvReqId}"
            : request.RequestCode;
        var warehouseName = request.Warehouse?.Name ?? $"Kho #{request.WarehouseId}";

        return $"OWRMS - Yêu cầu {typeText} {requestCode} đang chờ xử lý tại {warehouseName}";
    }

    private static string BuildBody(InventoryRequest request, string recipientName)
    {
        var typeText = request.Type == "INBOUND" ? "nhập kho" : "xuất kho";
        var actionText = request.Type == "INBOUND"
            ? "sẵn sàng tiếp nhận và kiểm đếm hàng hóa"
            : "sẵn sàng kiểm đếm và bàn giao hàng hóa";
        var requestLabel = string.IsNullOrWhiteSpace(request.RequestCode)
            ? $"#{request.InvReqId}"
            : $"#{request.InvReqId} - {request.RequestCode}";
        var warehouseName = request.Warehouse?.Name ?? $"Kho #{request.WarehouseId}";
        var renterName = request.Renter?.FullName ?? "Người thuê";
        var renterEmail = request.Renter?.Email;
        var renterPhone = request.Renter?.Phone;
        var scheduledDate = request.ScheduledDate?.ToString("dd/MM/yyyy") ?? "Chưa có";
        var createdAt = request.CreatedAt?.ToString("dd/MM/yyyy HH:mm") ?? DateTime.Now.ToString("dd/MM/yyyy HH:mm");
        var notes = string.IsNullOrWhiteSpace(request.Notes) ? "Không có" : request.Notes;
        var itemRows = BuildItemRows(request.InventoryItems);

        return $@"
<div style='font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; color: #111827;'>
    <h2 style='margin: 0 0 12px; color: #047857;'>Yêu cầu {H(typeText)} đang chờ xử lý tại kho</h2>
    <p>Xin chào <strong>{H(recipientName)}</strong>,</p>
    <p>Hệ thống vừa ghi nhận một yêu cầu <strong>{H(typeText)}</strong> đã ở trạng thái <strong>Chờ xử lý tại kho</strong>. Vui lòng sắp xếp công việc để {H(actionText)} theo ngày dự kiến.</p>

    <div style='background-color: #f9fafb; padding: 14px 16px; border-radius: 6px; margin: 18px 0; border: 1px solid #e5e7eb;'>
        <h3 style='margin: 0 0 10px; color: #374151;'>Thông tin yêu cầu</h3>
        <ul style='margin: 0; padding-left: 18px; line-height: 1.7; color: #4b5563;'>
            <li><strong>Mã yêu cầu:</strong> {H(requestLabel)}</li>
            <li><strong>Kho xử lý:</strong> {H(warehouseName)}</li>
            <li><strong>Người thuê:</strong> {H(renterName)}</li>
            <li><strong>Email người thuê:</strong> {H(renterEmail ?? "Chưa có")}</li>
            <li><strong>Số điện thoại:</strong> {H(renterPhone ?? "Chưa có")}</li>
            <li><strong>Ngày dự kiến:</strong> {H(scheduledDate)}</li>
            <li><strong>Ngày tạo:</strong> {H(createdAt)}</li>
            <li><strong>Ghi chú:</strong> {H(notes)}</li>
        </ul>
    </div>

    <div style='background-color: #ecfdf5; padding: 14px 16px; border-radius: 6px; margin: 18px 0; border: 1px solid #bbf7d0;'>
        <h3 style='margin: 0 0 10px; color: #065f46;'>Danh sách hàng hóa</h3>
        <table style='width: 100%; border-collapse: collapse; font-size: 14px;'>
            <thead>
                <tr>
                    <th style='text-align: left; padding: 8px; border-bottom: 1px solid #a7f3d0;'>Mặt hàng</th>
                    <th style='text-align: right; padding: 8px; border-bottom: 1px solid #a7f3d0;'>Số lượng</th>
                    <th style='text-align: left; padding: 8px; border-bottom: 1px solid #a7f3d0;'>Đơn vị</th>
                </tr>
            </thead>
            <tbody>
                {itemRows}
            </tbody>
        </table>
    </div>

    <p style='margin: 18px 0;'>Vui lòng kiểm tra danh sách yêu cầu trong màn hình nhân viên kho và chuẩn bị nhân sự, khu vực, thiết bị cần thiết.</p>
    <div style='text-align: center; margin-top: 24px;'>
        <a href='{StaffRequestsUrl}' style='display: inline-block; background-color: #2563eb; color: white; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: bold;'>Mở danh sách yêu cầu</a>
    </div>
    <hr style='border: none; border-top: 1px solid #e5e7eb; margin: 26px 0;' />
    <p style='font-size: 12px; color: #6b7280; text-align: center;'>Đây là email tự động từ hệ thống OWRMS.</p>
</div>";
    }

    private static string BuildItemRows(IEnumerable<InventoryItem> items)
    {
        var rows = items.ToList();
        if (rows.Count == 0)
        {
            return @"
                <tr>
                    <td colspan='3' style='padding: 8px; color: #6b7280;'>Chưa có mặt hàng</td>
                </tr>";
        }

        return string.Join(
            Environment.NewLine,
            rows.Select(item => $@"
                <tr>
                    <td style='padding: 8px; border-bottom: 1px solid #d1fae5;'>{H(item.ItemName)}</td>
                    <td style='padding: 8px; border-bottom: 1px solid #d1fae5; text-align: right;'>{item.Quantity}</td>
                    <td style='padding: 8px; border-bottom: 1px solid #d1fae5;'>{H(item.Unit)}</td>
                </tr>"));
    }

    private static string H(string value) => WebUtility.HtmlEncode(value);
}
