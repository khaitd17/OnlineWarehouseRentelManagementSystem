namespace WMS.Application.Interfaces;

public interface IEmailService
{
    Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetToken, string resetLink);
    Task SendInfo(string email, string toName, string subject, string htmlContent);
    
    // Cancel/Timeout Email Templates
    Task SendRentalRequestCancelledAsync(string toEmail, string toName, string warehouseName, string reason, string cancelledBy);
    Task SendContractDeclinedAsync(string toEmail, string toName, string warehouseName, string reason);
    Task SendSignatureExpiredAsync(string toEmail, string toName, string warehouseName, string contractCode);
    Task SendPaymentExpiredAsync(string toEmail, string toName, string warehouseName, string contractCode, decimal amount);
    Task SendPaymentReminderAsync(string toEmail, string toName, string warehouseName, string contractCode, decimal amount, DateTime expiry);
    Task SendPaymentRetryAsync(string toEmail, string toName, string warehouseName, string contractCode, decimal amount, int retryCount, int maxRetry);
}
