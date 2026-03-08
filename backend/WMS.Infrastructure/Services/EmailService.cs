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
}
