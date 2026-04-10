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
        var accountName = _settings.AccountName ?? "TRAN DINH KHAI";
        var bankName = _settings.BankName ?? "MB";
        var accountNumber = _settings.AccountNumber ?? "7758672937405";

        var encodedAccountName = Uri.EscapeDataString(accountName);
        var encodedDescription = Uri.EscapeDataString(paymentCode);

        var qrImageUrl = $"https://img.vietqr.io/image/{bankName}-{accountNumber}-compact2.png" +
                         $"?amount={(int)amount}&addInfo={encodedDescription}&accountName={encodedAccountName}";

        return new QrPaymentInfo
        {
            BankName = bankName,
            AccountNumber = accountNumber,
            AccountName = accountName,
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

            // Extract code and type
            var identifier = ExtractIdentifierCode(payload.Content);

            if (identifier == null)
            {
                _logger.LogWarning("Could not extract payment code from content: {Content}", payload.Content);
                return WebhookResult.Ignored("No valid payment code found in content");
            }

            var type = identifier.Value.Type;
            var paymentCode = identifier.Value.Code;

            if (type == "WMS")
            {
                // RENTAL PAYMENT logic
                var payment = _db.RentalPayments.FirstOrDefault(p => p.PaymentCode == paymentCode && p.Status == PaymentStatus.Pending);
                if (payment == null) return WebhookResult.Ignored($"Payment {paymentCode} not found or not pending");
                
                payment.CompleteFromSepay(payload.Id, payload.ReferenceCode ?? "");
                var contract = await _db.RentalContracts.FindAsync(payment.ContractId);
                if (contract != null && contract.IsPendingPayment) contract.ActivateAfterPayment();
                
                await _db.SaveChangesAsync();
                return WebhookResult.Ok(paymentCode, payment.PaymentId, "RENTAL");
            }
            else if (type == "SUB")
            {
                // SUBSCRIPTION logic
                var subscription = _db.Subscriptions.FirstOrDefault(s => s.TransactionReference == paymentCode && s.Status == SubscriptionStatus.Pending);
                if (subscription == null) return WebhookResult.Ignored($"Subscription {paymentCode} not found or not pending");

                subscription.Status = SubscriptionStatus.Active;

                // Find if there is an existing active subscription to extend
                var lastActiveSub = _db.Subscriptions
                    .Where(s => s.UserId == subscription.UserId && s.Status == SubscriptionStatus.Active && s.SubscriptionId != subscription.SubscriptionId)
                    .OrderByDescending(s => s.EndDate)
                    .FirstOrDefault();

                if (lastActiveSub != null && lastActiveSub.EndDate > DateTime.UtcNow)
                {
                    subscription.StartDate = lastActiveSub.EndDate;
                    subscription.EndDate = lastActiveSub.EndDate.Value.AddDays(30);
                }
                else
                {
                    subscription.StartDate = DateTime.UtcNow;
                    subscription.EndDate = DateTime.UtcNow.AddDays(30);
                }

                // Create or unlock warehouses
                var existingWarehouses = _db.Warehouses.Where(w => w.OwnerId == subscription.UserId).ToList();
                if (!existingWarehouses.Any())
                {
                    var user = _db.Users.Find(subscription.UserId);
                    var newWarehouse = new Warehouse
                    {
                        Name = $"Kho mới của {user?.FullName ?? "bạn"}",
                        Address = "Chưa cập nhật",
                        OwnerId = subscription.UserId,
                        TotalArea = 0,
                        AvailableArea = 0,
                        Status = "APPROVED",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _db.Warehouses.Add(newWarehouse);
                    await _db.SaveChangesAsync();

                    var ownerWhRole = _db.WarehouseRoles.FirstOrDefault(r => r.Code == "OWNER");
                    if (ownerWhRole != null)
                    {
                        var membership = new WarehouseMembership
                        {
                            UserId = subscription.UserId,
                            WarehouseId = newWarehouse.WarehouseId,
                            WarehouseRoleId = ownerWhRole.Id,
                            IsActive = true,
                            IsAllSkill = true,
                            IsAllZone = true,
                            CreatedAt = DateTime.UtcNow
                        };
                        _db.WarehouseMemberships.Add(membership);
                    }
                }
                else
                {
                    foreach (var w in existingWarehouses)
                    {
                        if (w.Status == "LOCKED") w.Status = "APPROVED"; // Unlock
                    }
                }

                await _db.SaveChangesAsync();
                return WebhookResult.Ok(paymentCode, subscription.SubscriptionId, "SUBSCRIPTION");
            }

            return WebhookResult.Ignored("Unknown type");
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

    private static (string Type, string Code)? ExtractIdentifierCode(string? content)
    {
        if (string.IsNullOrEmpty(content)) return null;

        var wmsMatch = Regex.Match(content, @"WMS\d{6}", RegexOptions.IgnoreCase);
        if (wmsMatch.Success) return ("WMS", wmsMatch.Value.ToUpper());

        var subMatch = Regex.Match(content, @"SUB\d{6}", RegexOptions.IgnoreCase);
        if (subMatch.Success) return ("SUB", subMatch.Value.ToUpper());

        return null;
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
