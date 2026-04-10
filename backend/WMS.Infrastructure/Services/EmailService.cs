using Microsoft.Extensions.Configuration;
using System.Net;
using System.Net.Mail;
using WMS.Application.Interfaces;

namespace WMS.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;

    public EmailService(IConfiguration config)
    {
        _config = config;
    }

    public async Task SendInfo(string email, string toName, string subject, string htmlContent)
    {
        var smtpHost = _config["Smtp:Host"] ?? "smtp.mailtrap.io";
        var smtpPort = int.TryParse(_config["Smtp:Port"], out int p) ? p : 587;
        var smtpUser = _config["Smtp:Username"] ?? throw new InvalidOperationException("Smtp:Username chưa được cấu hình.");
        var smtpPass = _config["Smtp:Password"] ?? throw new InvalidOperationException("Smtp:Password chưa được cấu hình.");
        var fromName = _config["Smtp:FromName"] ?? "Hệ thống OWRMS";

        using var client = new SmtpClient(smtpHost, smtpPort)
        {
            Credentials = new NetworkCredential(smtpUser, smtpPass),
            EnableSsl = true
        };

        using var message = new MailMessage
        {
            From = new MailAddress(smtpUser, fromName),
            Subject = subject,
            Body = htmlContent,
            IsBodyHtml = true
        };

        message.To.Add(new MailAddress(email, toName));

        await client.SendMailAsync(message);
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetToken, string resetLink)
    {
        var smtpHost = _config["Smtp:Host"] ?? "smtp.mailtrap.io";
        var smtpPort = int.TryParse(_config["Smtp:Port"], out int p) ? p : 587;
        var smtpUser = _config["Smtp:Username"] ?? throw new InvalidOperationException("Smtp:Username chưa được cấu hình.");
        var smtpPass = _config["Smtp:Password"] ?? throw new InvalidOperationException("Smtp:Password chưa được cấu hình.");
        var fromName = _config["Smtp:FromName"] ?? "Hệ thống OWRMS";

        using var client = new SmtpClient(smtpHost, smtpPort)
        {
            Credentials = new NetworkCredential(smtpUser, smtpPass),
            EnableSsl = true
        };

        var body = $@"
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; border-top: 4px solid #0095c7;'>
    <div style='text-align: center; margin-bottom: 24px;'>
        <h2 style='color: #0f172a; margin-bottom: 8px;'>Yêu cầu đặt lại mật khẩu</h2>
        <p style='color: #64748b; font-size: 14px;'>Xin chào {toName}, chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản OWRMS của bạn.</p>
    </div>
    
    <div style='background-color: #f8fafc; padding: 24px; border-radius: 8px; text-align: center; margin-bottom: 24px;'>
        <p style='margin-bottom: 20px; color: #334155;'>Vui lòng nhấn vào nút bên dưới để tiến hành đặt lại mật khẩu của bạn. Liên kết này sẽ hết hạn sau 1 giờ.</p>
        <a href='{resetLink}' style='display: inline-block; padding: 12px 32px; background-color: #0095c7; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px;'>Đặt lại mật khẩu</a>
    </div>

    <div style='font-size: 12px; color: #94a3b8; line-height: 1.6;'>
        <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc liên kết với chúng tôi nếu bạn lo ngại về bảo mật.</p>
        <p style='margin-top: 16px; border-top: 1px solid #f1f5f9; padding-top: 16px;'>© 2024 Online Warehouse Rental Management System (OWRMS)</p>
    </div>
</div>";

        var message = new MailMessage
        {
            From = new MailAddress(smtpUser, fromName),
            Subject = "Đặt lại mật khẩu - OWRMS",
            Body = body,
            IsBodyHtml = true
        };
        message.To.Add(new MailAddress(toEmail, toName));

        await client.SendMailAsync(message);
    }

    // ========== CANCEL/TIMEOUT EMAIL TEMPLATES ==========

    public async Task SendRentalRequestCancelledAsync(string toEmail, string toName, string warehouseName, string reason, string cancelledBy)
    {
        var subject = "Yêu cầu thuê kho đã bị hủy - OWRMS";
        var body = BuildEmailTemplate(
            "Yêu cầu thuê kho đã bị hủy",
            toName,
            $@"<p>Yêu cầu thuê kho <strong>{warehouseName}</strong> đã bị hủy.</p>
               <div style='background-color: #fef2f2; padding: 16px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 16px 0;'>
                   <p style='margin: 0; color: #991b1b;'><strong>Lý do:</strong> {reason}</p>
                   <p style='margin: 8px 0 0 0; color: #991b1b;'><strong>Hủy bởi:</strong> {cancelledBy}</p>
               </div>
               <p>Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi.</p>"
        );
        await SendInfo(toEmail, toName, subject, body);
    }

    public async Task SendContractDeclinedAsync(string toEmail, string toName, string warehouseName, string reason)
    {
        var subject = "Hợp đồng thuê kho đã bị từ chối - OWRMS";
        var body = BuildEmailTemplate(
            "Hợp đồng đã bị từ chối",
            toName,
            $@"<p>Hợp đồng thuê kho <strong>{warehouseName}</strong> đã bị từ chối ký.</p>
               <div style='background-color: #fef2f2; padding: 16px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 16px 0;'>
                   <p style='margin: 0; color: #991b1b;'><strong>Lý do từ chối:</strong> {reason}</p>
               </div>
               <p>Vui lòng liên hệ với chủ kho hoặc bộ phận hỗ trợ nếu cần thêm thông tin.</p>"
        );
        await SendInfo(toEmail, toName, subject, body);
    }

    public async Task SendSignatureExpiredAsync(string toEmail, string toName, string warehouseName, string contractCode)
    {
        var subject = "Hợp đồng hết hạn chờ ký - OWRMS";
        var body = BuildEmailTemplate(
            "Hợp đồng đã hết hạn",
            toName,
            $@"<p>Hợp đồng <strong>{contractCode}</strong> cho kho <strong>{warehouseName}</strong> đã hết hạn chờ ký.</p>
               <div style='background-color: #fef3cd; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 16px 0;'>
                   <p style='margin: 0; color: #92400e;'>Hợp đồng đã không được ký trong thời hạn quy định (48 giờ) và đã bị hủy tự động.</p>
               </div>
               <p>Nếu bạn vẫn muốn thuê kho này, vui lòng tạo yêu cầu thuê mới.</p>"
        );
        await SendInfo(toEmail, toName, subject, body);
    }

    public async Task SendPaymentExpiredAsync(string toEmail, string toName, string warehouseName, string contractCode, decimal amount)
    {
        var subject = "Thanh toán hết hạn - Hợp đồng đã bị hủy - OWRMS";
        var body = BuildEmailTemplate(
            "Thanh toán đã hết hạn",
            toName,
            $@"<p>Thanh toán cho hợp đồng <strong>{contractCode}</strong> (kho <strong>{warehouseName}</strong>) đã hết hạn.</p>
               <div style='background-color: #fef2f2; padding: 16px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 16px 0;'>
                   <p style='margin: 0; color: #991b1b;'><strong>Số tiền:</strong> {amount:N0} VNĐ</p>
                   <p style='margin: 8px 0 0 0; color: #991b1b;'>Thanh toán không được thực hiện trong thời hạn quy định và hợp đồng đã bị hủy tự động.</p>
               </div>
               <p>Nếu bạn vẫn muốn thuê kho này, vui lòng tạo yêu cầu thuê mới.</p>"
        );
        await SendInfo(toEmail, toName, subject, body);
    }

    public async Task SendPaymentReminderAsync(string toEmail, string toName, string warehouseName, string contractCode, decimal amount, DateTime expiry)
    {
        var subject = "⚠️ Nhắc nhở thanh toán - Sắp hết hạn - OWRMS";
        var timeRemaining = expiry - DateTime.UtcNow;
        var hoursRemaining = Math.Max(0, (int)timeRemaining.TotalHours);
        
        var body = BuildEmailTemplate(
            "Nhắc nhở thanh toán",
            toName,
            $@"<p>Thanh toán cho hợp đồng <strong>{contractCode}</strong> (kho <strong>{warehouseName}</strong>) sắp hết hạn.</p>
               <div style='background-color: #fef3cd; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 16px 0;'>
                   <p style='margin: 0; color: #92400e;'><strong>Số tiền cần thanh toán:</strong> {amount:N0} VNĐ</p>
                   <p style='margin: 8px 0 0 0; color: #92400e;'><strong>Thời gian còn lại:</strong> khoảng {hoursRemaining} giờ</p>
                   <p style='margin: 8px 0 0 0; color: #92400e;'><strong>Hết hạn lúc:</strong> {expiry:dd/MM/yyyy HH:mm}</p>
               </div>
               <p>Vui lòng hoàn tất thanh toán trước thời hạn để tránh hợp đồng bị hủy.</p>"
        );
        await SendInfo(toEmail, toName, subject, body);
    }

    public async Task SendPaymentRetryAsync(string toEmail, string toName, string warehouseName, string contractCode, decimal amount, int retryCount, int maxRetry)
    {
        var subject = "Thanh toán lại - OWRMS";
        var body = BuildEmailTemplate(
            "Thanh toán lại",
            toName,
            $@"<p>Bạn đã yêu cầu thanh toán lại cho hợp đồng <strong>{contractCode}</strong> (kho <strong>{warehouseName}</strong>).</p>
               <div style='background-color: #dbeafe; padding: 16px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 16px 0;'>
                   <p style='margin: 0; color: #1e40af;'><strong>Số tiền:</strong> {amount:N0} VNĐ</p>
                   <p style='margin: 8px 0 0 0; color: #1e40af;'><strong>Lần thử:</strong> {retryCount}/{maxRetry}</p>
               </div>
               <p>Vui lòng hoàn tất thanh toán trong vòng 48 giờ.</p>"
        );
        await SendInfo(toEmail, toName, subject, body);
    }

    private string BuildEmailTemplate(string title, string toName, string content)
    {
        return $@"
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; border-top: 4px solid #0095c7;'>
    <div style='text-align: center; margin-bottom: 24px;'>
        <h2 style='color: #0f172a; margin-bottom: 8px;'>{title}</h2>
        <p style='color: #64748b; font-size: 14px;'>Xin chào {toName},</p>
    </div>
    
    <div style='background-color: #f8fafc; padding: 24px; border-radius: 8px; margin-bottom: 24px;'>
        {content}
    </div>

    <div style='font-size: 12px; color: #94a3b8; line-height: 1.6;'>
        <p>Email này được gửi tự động từ hệ thống OWRMS. Vui lòng không trả lời trực tiếp email này.</p>
        <p style='margin-top: 16px; border-top: 1px solid #f1f5f9; padding-top: 16px;'>© 2024 Online Warehouse Rental Management System (OWRMS)</p>
    </div>
</div>";
    }
}
