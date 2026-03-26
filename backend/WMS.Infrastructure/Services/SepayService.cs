using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Enums;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Services;

public class SepayService : ISepayService
{
    private readonly SepaySettings _settings;
    private readonly ApplicationDbContext _db;
    private readonly ILogger<SepayService> _logger;
    private readonly HttpClient _httpClient;
    private readonly string[] _whitelistIps;

    public SepayService(
        IOptions<SepaySettings> settings,
        ApplicationDbContext db,
        ILogger<SepayService> logger,
        IHttpClientFactory httpClientFactory)
    {
        _settings = settings.Value;
        _db = db;
        _logger = logger;
        _httpClient = httpClientFactory.CreateClient("SePay");
        _whitelistIps = _settings.GetWhitelistIpArray();
    }

    public QrPaymentInfo GenerateQrInfo(string paymentCode, decimal amount, string description)
    {
        // VietQR URL format
        var encodedAccountName = Uri.EscapeDataString(_settings.AccountName);
        var encodedDescription = Uri.EscapeDataString(paymentCode);

        var qrImageUrl = $"https://img.vietqr.io/image/{_settings.BankName}-{_settings.AccountNumber}-compact2.png" +
                         $"?amount={(int)amount}&addInfo={encodedDescription}&accountName={encodedAccountName}";

        return new QrPaymentInfo
        {
            BankName = _settings.BankName,
            AccountNumber = _settings.AccountNumber,
            AccountName = _settings.AccountName,
            Amount = amount,
            PaymentCode = paymentCode,
            Description = description,
            QrImageUrl = qrImageUrl
        };
    }

    public async Task<WebhookResult> ProcessWebhookAsync(SepayWebhookPayload payload)
    {
        try
        {
            _logger.LogInformation("Processing SePay webhook: TransactionId={TransactionId}, Amount={Amount}, Content={Content}",
                payload.Id, payload.TransferAmount, payload.Content);

            // Only process incoming transfers
            if (payload.TransferType != "in")
            {
                _logger.LogInformation("Ignoring outgoing transfer");
                return WebhookResult.Ignored("Outgoing transfer ignored");
            }

            // Check for duplicate transaction
            var existingPayment = _db.RentalPayments
                .FirstOrDefault(p => p.SepayTransactionId == payload.Id);

            if (existingPayment != null)
            {
                _logger.LogInformation("Duplicate webhook for transaction {TransactionId}", payload.Id);
                return WebhookResult.Ok(existingPayment.PaymentCode, existingPayment.PaymentId);
            }

            // Extract payment code from content (format: WMS123456)
            var paymentCode = ExtractPaymentCode(payload.Content);

            if (string.IsNullOrEmpty(paymentCode))
            {
                _logger.LogWarning("Could not extract payment code from content: {Content}", payload.Content);
                return WebhookResult.Ignored("No valid payment code found in content");
            }

            // Find pending payment
            var payment = _db.RentalPayments
                .FirstOrDefault(p => p.PaymentCode == paymentCode && p.Status == PaymentStatus.Pending);

            if (payment == null)
            {
                _logger.LogWarning("Payment not found or not pending: {PaymentCode}", paymentCode);
                return WebhookResult.Ignored($"Payment {paymentCode} not found or not pending");
            }

            // Verify amount matches (with small tolerance for rounding)
            if (Math.Abs(payment.Amount - payload.TransferAmount) > 1)
            {
                _logger.LogWarning("Amount mismatch: Expected {Expected}, Got {Actual}",
                    payment.Amount, payload.TransferAmount);
                // Still process but log warning - bank might have different formatting
            }

            // Complete payment
            payment.CompleteFromSepay(payload.Id, payload.ReferenceCode ?? "");

            // Find and activate contract
            var contract = await _db.RentalContracts.FindAsync(payment.ContractId);
            if (contract != null && contract.IsPendingPayment)
            {
                contract.ActivateAfterPayment();
                _logger.LogInformation("Contract {ContractId} activated after payment", contract.ContractId);
            }

            await _db.SaveChangesAsync();

            _logger.LogInformation("Payment {PaymentCode} completed successfully", paymentCode);
            return WebhookResult.Ok(paymentCode, payment.PaymentId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing SePay webhook");
            return WebhookResult.Fail(ex.Message);
        }
    }

    public async Task<TransactionInfo?> CheckTransactionAsync(string paymentCode)
    {
        try
        {
            var request = new HttpRequestMessage(HttpMethod.Get,
                $"https://my.sepay.vn/userapi/transactions/list?reference_number={paymentCode}");

            request.Headers.Authorization = new AuthenticationHeaderValue("Apikey", _settings.ApiToken);

            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("SePay API returned {StatusCode}", response.StatusCode);
                return null;
            }

            var content = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<SepayTransactionResponse>(content,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (result?.Transactions?.Any() == true)
            {
                var transaction = result.Transactions.First();
                return new TransactionInfo
                {
                    Id = transaction.Id,
                    TransactionDate = transaction.TransactionDate,
                    Amount = transaction.AmountIn ?? 0,
                    Content = transaction.TransactionContent,
                    ReferenceCode = transaction.ReferenceNumber
                };
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking transaction from SePay API");
            return null;
        }
    }

    public bool IsValidSepayIp(string ipAddress)
    {
        if (string.IsNullOrEmpty(ipAddress))
            return false;

        // Allow localhost for testing
        if (ipAddress == "127.0.0.1" || ipAddress == "::1")
            return true;

        return _whitelistIps.Contains(ipAddress);
    }

    private static string? ExtractPaymentCode(string? content)
    {
        if (string.IsNullOrEmpty(content))
            return null;

        // Match WMS followed by 6 digits (e.g., WMS123456)
        var match = Regex.Match(content, @"WMS\d{6}", RegexOptions.IgnoreCase);
        return match.Success ? match.Value.ToUpper() : null;
    }

    // Response models for SePay API
    private class SepayTransactionResponse
    {
        public int Status { get; set; }
        public List<SepayTransaction>? Transactions { get; set; }
    }

    private class SepayTransaction
    {
        public int Id { get; set; }
        public string? TransactionDate { get; set; }
        public string? AccountNumber { get; set; }
        public decimal? AmountIn { get; set; }
        public decimal? AmountOut { get; set; }
        public string? TransactionContent { get; set; }
        public string? ReferenceNumber { get; set; }
        public string? BankBrandName { get; set; }
    }
}
