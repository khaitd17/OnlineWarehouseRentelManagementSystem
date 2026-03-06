namespace WMS.Application.Interfaces;

public interface IEmailService
{
    Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetToken, string resetLink);
    Task SendInfo(string email, string toName,string subject, string htmlContent);
}
