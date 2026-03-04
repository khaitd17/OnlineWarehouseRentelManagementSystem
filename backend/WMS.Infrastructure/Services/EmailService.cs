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

    public async Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetToken, string resetLink)
    {
        var smtpHost = _config["Smtp:Host"] ?? "smtp.gmail.com";
        var smtpPort = int.TryParse(_config["Smtp:Port"], out int p) ? p : 587;
        var smtpUser = _config["Smtp:Username"] ?? throw new InvalidOperationException("Smtp:Username chưa được cấu hình.");
        var smtpPass = _config["Smtp:Password"] ?? throw new InvalidOperationException("Smtp:Password chưa được cấu hình.");
        var fromName = _config["Smtp:FromName"] ?? "OWRMS Support";

        var client = new SmtpClient(smtpHost, smtpPort)
        {
            Credentials = new NetworkCredential(smtpUser, smtpPass),
            EnableSsl = true
        };

        var body = $@"
<html>
<body style='font-family: Arial, sans-serif; background:#f4f4f4; padding:20px;'>
  <div style='max-width:600px; margin:auto; background:white; border-radius:8px; padding:30px;'>
    <h2 style='color:#2c3e50;'>Đặt lại mật khẩu</h2>
    <p>Xin chào <strong>{toName}</strong>,</p>
    <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
    <p>Nhấn vào nút bên dưới để đặt lại mật khẩu. Link có hiệu lực trong <strong>1 giờ</strong>.</p>
    <div style='text-align:center; margin:30px 0;'>
      <a href='{resetLink}'
         style='background:#3498db; color:white; padding:12px 24px; text-decoration:none; border-radius:5px; font-size:16px;'>
        Đặt lại mật khẩu
      </a>
    </div>
    <p style='color:#7f8c8d; font-size:13px;'>
      Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
    </p>
    <hr style='border:none; border-top:1px solid #eee; margin:20px 0;'/>
    <p style='color:#7f8c8d; font-size:12px;'>© 2025 Online Warehouse Rental Management System</p>
  </div>
</body>
</html>";

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
