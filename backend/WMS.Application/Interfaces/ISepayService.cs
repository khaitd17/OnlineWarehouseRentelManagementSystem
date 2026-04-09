namespace WMS.Application.Interfaces;

public interface ISepayService
{
    /// <summary>
    /// Tạo thông tin QR code cho thanh toán
    /// </summary>
    QrPaymentInfo GenerateQrInfo(string paymentCode, decimal amount, string description);

    /// <summary>
    /// Xử lý webhook từ SePay
    /// </summary>
    Task<WebhookResult> ProcessWebhookAsync(SepayWebhookPayload payload);

    /// <summary>
    /// Kiểm tra trạng thái giao dịch qua API SePay
    /// </summary>
    Task<TransactionInfo?> CheckTransactionAsync(string paymentCode);

    /// <summary>
    /// Validate IP whitelist của SePay
    /// </summary>
    bool IsValidSepayIp(string ipAddress);
}

public class QrPaymentInfo
{
    public string BankName { get; set; } = null!;
    public string AccountNumber { get; set; } = null!;
    public string AccountName { get; set; } = null!;
    public decimal Amount { get; set; }
    public string PaymentCode { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string QrImageUrl { get; set; } = null!;
}

public class SepayWebhookPayload
{
    public int Id { get; set; }
    public string? Gateway { get; set; }
    public string? TransactionDate { get; set; }
    public string? AccountNumber { get; set; }
    public string? Code { get; set; }
    public string? Content { get; set; }
    public string? TransferType { get; set; }
    public decimal TransferAmount { get; set; }
    public decimal? Accumulated { get; set; }
    public string? SubAccount { get; set; }
    public string? ReferenceCode { get; set; }
    public string? Description { get; set; }
}

public class WebhookResult
{
    public bool Success { get; set; }
    public string? PaymentCode { get; set; }
    public int? PaymentId { get; set; }
    public string? PaymentType { get; set; }
    public string? ErrorMessage { get; set; }

    public static WebhookResult Ok(string paymentCode, int paymentId, string paymentType = "RENTAL") => new()
    {
        Success = true,
        PaymentCode = paymentCode,
        PaymentId = paymentId,
        PaymentType = paymentType
    };

    public static WebhookResult Fail(string message) => new()
    {
        Success = false,
        ErrorMessage = message
    };

    public static WebhookResult Ignored(string message) => new()
    {
        Success = true, // Return success to SePay but didn't process
        ErrorMessage = message
    };
}

public class TransactionInfo
{
    public int Id { get; set; }
    public string? TransactionDate { get; set; }
    public decimal Amount { get; set; }
    public string? Content { get; set; }
    public string? ReferenceCode { get; set; }
}
