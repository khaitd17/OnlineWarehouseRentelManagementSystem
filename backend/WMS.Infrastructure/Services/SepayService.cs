using System.Collections.Concurrent;
using System.Net;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;
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
    private static readonly ConcurrentDictionary<string, DateTime> TransactionCheckCooldowns =
        new(StringComparer.OrdinalIgnoreCase);

    private static readonly TimeSpan DefaultCheckCooldown = TimeSpan.FromSeconds(20);
    private static readonly TimeSpan RateLimitCheckCooldown = TimeSpan.FromSeconds(90);

    private static readonly JsonSerializerOptions SepayJsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        NumberHandling = JsonNumberHandling.AllowReadingFromString
    };

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
            if (!string.Equals(payload.TransferType, "in", StringComparison.OrdinalIgnoreCase))
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
                var acceptedStatuses = new[]
                {
                    PaymentStatus.Pending,
                    PaymentStatus.Failed,
                    PaymentStatus.Expired,
                    PaymentStatus.RetryPending
                };

                var payment = _db.RentalPayments.FirstOrDefault(p => p.PaymentCode == paymentCode && acceptedStatuses.Contains(p.Status));
                if (payment == null) return WebhookResult.Ignored($"Payment {paymentCode} not found or not in acceptable status");
                
                payment.CompleteFromSepay(payload.Id, payload.ReferenceCode ?? "");

                // Primary contract source for rental_payments is contracts table.
                var contract = await _db.Contracts.FindAsync(payment.ContractId);
                if (contract != null && contract.Status == RentalContractStatus.PendingPayment)
                {
                    contract.Status = RentalContractStatus.Active;
                    contract.UpdatedAt = DateTime.UtcNow;

                    // Deduct area from warehouse now that contract is ACTIVE
                    var rentalRequest = await _db.RentalRequests.FindAsync(contract.RequestId);
                    if (rentalRequest != null)
                    {
                        var wh = await _db.Warehouses.FindAsync(contract.WarehouseId);
                        if (wh != null)
                        {
                            wh.AvailableArea -= rentalRequest.RequestedArea;
                            _logger.LogInformation("Deducted {Area}m³ from warehouse {WhId} via webhook. New available: {Available}m³",
                                rentalRequest.RequestedArea, wh.WarehouseId, wh.AvailableArea);
                        }
                    }

                    // Grant RENTER membership in the warehouse so the renter can use warehouse features
                    await EnsureRenterMembershipAsync(contract.RenterId, contract.WarehouseId);
                }
                else if (contract != null && payment.PaymentType == PaymentType.Extension)
                {
                    var extension = await _db.ContractExtensions
                        .Where(e => e.OriginalContractId == payment.ContractId
                                    && e.Status == ContractExtensionStatus.PendingPayment)
                        .OrderByDescending(e => e.RequestedAt)
                        .FirstOrDefaultAsync();

                    if (extension != null)
                    {
                        var approvedMonthly = extension.ProposedMonthlyPayment ?? contract.MonthlyPayment;
                        var updatedEndDate = contract.EndDate.AddMonths(extension.DurationMonths);
                        var totalMonths = Math.Max(1, (updatedEndDate.Year - contract.StartDate.Year) * 12 + (updatedEndDate.Month - contract.StartDate.Month));

                        contract.EndDate = updatedEndDate;
                        contract.MonthlyPayment = approvedMonthly;
                        contract.TotalValue = approvedMonthly * totalMonths;
                        contract.UpdatedAt = DateTime.UtcNow;

                        extension.MarkCompleted();
                    }
                }
                else if (contract != null &&
                         payment.PaymentType == PaymentType.Penalty &&
                         contract.Status == RentalContractStatus.PendingTermination &&
                         contract.OwnerApprovedTermination &&
                         contract.RenterApprovedTermination &&
                         (contract.EarlyTerminationFee ?? 0) > 0)
                {
                    contract.Status = RentalContractStatus.Terminated;
                    contract.TerminatedAt = DateTime.UtcNow;
                    contract.UpdatedAt = DateTime.UtcNow;
                }

                // Backward compatibility: keep legacy rental_contracts in sync if still used.
                var legacyContract = await _db.RentalContracts.FindAsync(payment.ContractId);
                if (legacyContract != null && legacyContract.IsPendingPayment)
                {
                    legacyContract.ActivateAfterPayment();
                }
                
                await _db.SaveChangesAsync();
                return WebhookResult.Ok(paymentCode, payment.PaymentId, "RENTAL");
            }
            else if (type == "SUB")
            {
                // SUBSCRIPTION logic
                var subscription = _db.Subscriptions.FirstOrDefault(s => s.TransactionReference == paymentCode && s.Status == SubscriptionStatus.Pending);
                if (subscription == null) return WebhookResult.Ignored($"Subscription {paymentCode} not found or not pending");

                var newPackage = await _db.SubscriptionPackages.FirstOrDefaultAsync(p => p.Name == subscription.Plan);
                if (newPackage == null) throw new Exception($"Package {subscription.Plan} not found");

                // Find existing active subscription
                var currentActiveSub = _db.Subscriptions
                    .Where(s => s.UserId == subscription.UserId && s.Status == SubscriptionStatus.Active && s.SubscriptionId != subscription.SubscriptionId && s.EndDate > DateTime.UtcNow)
                    .OrderByDescending(s => s.EndDate)
                    .FirstOrDefault();

                if (currentActiveSub != null)
                {
                    var currentPackage = await _db.SubscriptionPackages.FirstOrDefaultAsync(p => p.Name == currentActiveSub.Plan);
                    
                    decimal currentDailyPrice = currentPackage != null ? currentPackage.Price / (currentPackage.DurationMonths * 30m) : 0;
                    decimal newDailyPrice = newPackage.Price / (newPackage.DurationMonths * 30m);
                    
                    bool isDowngrade = currentPackage != null && newDailyPrice < currentDailyPrice;

                    if (!isDowngrade)
                    {
                        // Upgrade or Same Tier: convert remaining days based on daily price ratio
                        double remainingDays = (currentActiveSub.EndDate.Value - DateTime.UtcNow).TotalDays;
                        if (remainingDays < 0) remainingDays = 0;

                        double convertedDays = remainingDays;

                        // Only convert if it's an actual upgrade (different package prices)
                        if (currentPackage != null && newDailyPrice > 0 && currentDailyPrice < newDailyPrice)
                        {
                            convertedDays = (double)((decimal)remainingDays * (currentDailyPrice / newDailyPrice));
                        }

                        currentActiveSub.Status = SubscriptionStatus.Expired; // Đóng gói cũ
                        
                        subscription.Status = SubscriptionStatus.Active;
                        subscription.StartDate = DateTime.UtcNow;
                        double totalDays = Math.Round(convertedDays + (newPackage.DurationMonths * 30.0), MidpointRounding.AwayFromZero);
                        subscription.EndDate = DateTime.UtcNow.AddDays(totalDays);
                    }
                    else
                    {
                        // Downgrade: queue the new subscription after current ends
                        subscription.Status = SubscriptionStatus.Active;
                        subscription.StartDate = currentActiveSub.EndDate;
                        subscription.EndDate = currentActiveSub.EndDate.Value.AddDays(newPackage.DurationMonths * 30);
                    }
                }
                else
                {
                    subscription.Status = SubscriptionStatus.Active;
                    subscription.StartDate = DateTime.UtcNow;
                    subscription.EndDate = DateTime.UtcNow.AddDays(newPackage.DurationMonths * 30);
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
                    await _db.SaveChangesAsync(); // Flush để lấy WarehouseId mới

                    existingWarehouses = new List<Warehouse> { newWarehouse };
                }
                else
                {
                    // Unlock các kho bị khoá
                    foreach (var w in existingWarehouses)
                    {
                        if (w.Status == "LOCKED") w.Status = "APPROVED";
                    }
                }

                // Đảm bảo membership OWNER cho tất cả kho của user (idempotent)
                var ownerWhRole = await _db.WarehouseRoles.FirstOrDefaultAsync(r => r.Code == "OWNER");
                if (ownerWhRole != null)
                {
                    foreach (var wh in existingWarehouses)
                    {
                        var alreadyMember = _db.WarehouseMemberships.Any(m =>
                            m.UserId == subscription.UserId &&
                            m.WarehouseId == wh.WarehouseId &&
                            m.WarehouseRoleId == ownerWhRole.Id);

                        if (!alreadyMember)
                        {
                            _db.WarehouseMemberships.Add(new WarehouseMembership
                            {
                                UserId = subscription.UserId,
                                WarehouseId = wh.WarehouseId,
                                WarehouseRoleId = ownerWhRole.Id,
                                IsActive = true,
                                IsAllSkill = true,
                                IsAllZone = true,
                                CreatedAt = DateTime.UtcNow
                            });
                            _logger.LogInformation("Granted OWNER membership to user {UserId} for warehouse {WarehouseId}", subscription.UserId, wh.WarehouseId);
                        }
                        else
                        {
                            _logger.LogInformation("OWNER membership already exists for user {UserId} warehouse {WarehouseId} - skipped", subscription.UserId, wh.WarehouseId);
                        }
                    }
                }
                else
                {
                    _logger.LogWarning("OWNER warehouse role not found in database - cannot grant membership");
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
            if (string.IsNullOrWhiteSpace(paymentCode))
                return null;

            if (TryGetRemainingCooldown(paymentCode, out var remainingCooldown))
            {
                _logger.LogDebug("Skip SePay lookup for {PaymentCode} due to cooldown {RemainingSeconds}s", paymentCode, (int)remainingCooldown.TotalSeconds);
                return null;
            }

            var encodedCode = Uri.EscapeDataString(paymentCode);
            var isRateLimited = false;

            // Fast path: reference number match.
            var byReferenceResult = await QueryTransactionsAsync($"reference_number={encodedCode}&limit=20");
            isRateLimited |= byReferenceResult.IsRateLimited;

            var referenceMatch = byReferenceResult.Transactions
                .FirstOrDefault(t => IsIncomingTransaction(t)
                                     && MatchesPaymentCode(t, paymentCode));

            if (referenceMatch != null)
            {
                TransactionCheckCooldowns.TryRemove(paymentCode, out _);
                return MapToTransactionInfo(referenceMatch);
            }

            // Robust path: scan recent incoming transactions for the payment code in transfer content.
            var accountNumber = Uri.EscapeDataString(_settings.AccountNumber ?? string.Empty);
            var minDate = Uri.EscapeDataString(DateTime.UtcNow.AddDays(-7).ToString("yyyy-MM-dd"));
            var recentResult = await QueryTransactionsAsync($"account_number={accountNumber}&transaction_date_min={minDate}&limit=200");
            isRateLimited |= recentResult.IsRateLimited;

            var contentMatch = recentResult.Transactions
                .Where(IsIncomingTransaction)
                .FirstOrDefault(t => MatchesPaymentCode(t, paymentCode));

            if (contentMatch != null)
            {
                TransactionCheckCooldowns.TryRemove(paymentCode, out _);
                return MapToTransactionInfo(contentMatch);
            }

            var cooldown = isRateLimited ? RateLimitCheckCooldown : DefaultCheckCooldown;
            SetCooldown(paymentCode, cooldown);

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking transaction from SePay API");
            return null;
        }
    }

    private async Task<SepayQueryResult> QueryTransactionsAsync(string queryString)
    {
        var request = new HttpRequestMessage(HttpMethod.Get,
            $"https://my.sepay.vn/userapi/transactions/list?{queryString}");

        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.ApiToken);

        var response = await _httpClient.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("SePay API returned {StatusCode} for query {Query}", response.StatusCode, queryString);
            return new SepayQueryResult
            {
                StatusCode = response.StatusCode
            };
        }

        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<SepayTransactionResponse>(content, SepayJsonOptions);

        return new SepayQueryResult
        {
            StatusCode = response.StatusCode,
            Transactions = result?.Transactions ?? new List<SepayTransaction>()
        };
    }

    private static bool TryGetRemainingCooldown(string paymentCode, out TimeSpan remaining)
    {
        remaining = TimeSpan.Zero;

        if (!TransactionCheckCooldowns.TryGetValue(paymentCode, out var nextAllowedAt))
            return false;

        if (nextAllowedAt <= DateTime.UtcNow)
        {
            TransactionCheckCooldowns.TryRemove(paymentCode, out _);
            return false;
        }

        remaining = nextAllowedAt - DateTime.UtcNow;
        return true;
    }

    private static void SetCooldown(string paymentCode, TimeSpan cooldown)
    {
        TransactionCheckCooldowns[paymentCode] = DateTime.UtcNow.Add(cooldown);
    }

    private static bool IsIncomingTransaction(SepayTransaction transaction)
        => (transaction.AmountIn ?? 0) > 0;

    private static bool MatchesPaymentCode(SepayTransaction transaction, string paymentCode)
    {
        var inContent = !string.IsNullOrWhiteSpace(transaction.TransactionContent)
                        && transaction.TransactionContent.Contains(paymentCode, StringComparison.OrdinalIgnoreCase);

        var inReference = !string.IsNullOrWhiteSpace(transaction.ReferenceNumber)
                          && transaction.ReferenceNumber.Contains(paymentCode, StringComparison.OrdinalIgnoreCase);

        return inContent || inReference;
    }

    private static TransactionInfo MapToTransactionInfo(SepayTransaction transaction)
    {
        return new TransactionInfo
        {
            Id = transaction.Id,
            TransactionDate = transaction.TransactionDate,
            Amount = transaction.AmountIn ?? 0,
            Content = transaction.TransactionContent,
            ReferenceCode = transaction.ReferenceNumber
        };
    }

    public bool IsValidSepayIp(string ipAddress)
    {
        if (string.IsNullOrEmpty(ipAddress))
            return false;

        // Allow localhost for testing
        if (ipAddress == "127.0.0.1" || ipAddress == "::1")
            return true;

        // Allow all IPs when running behind ngrok (development mode)
        // Ngrok changes the source IP, so whitelist doesn't work with ngrok
        // TODO: Remove this in production and use strict whitelist
        _logger.LogInformation("SePay webhook IP check: {IpAddress} (allowing all for dev/ngrok)", ipAddress);
        return true;
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

    /// <summary>
    /// Ensures the renter has a RENTER membership in the warehouse after contract activation.
    /// Idempotent: does nothing if membership already exists.
    /// </summary>
    private async Task EnsureRenterMembershipAsync(int renterId, int warehouseId)
    {
        const int RenterRoleId = 5; // warehouse_roles: RENTER

        var alreadyExists = await _db.WarehouseMemberships
            .AnyAsync(m => m.UserId == renterId
                        && m.WarehouseId == warehouseId
                        && m.WarehouseRoleId == RenterRoleId);

        if (!alreadyExists)
        {
            _db.WarehouseMemberships.Add(new WarehouseMembership
            {
                UserId = renterId,
                WarehouseId = warehouseId,
                WarehouseRoleId = RenterRoleId,
                IsActive = true,
                IsAllSkill = true,
                IsAllZone = true,
                CreatedAt = DateTime.UtcNow
            });

            _logger.LogInformation(
                "RENTER membership granted to user {UserId} for warehouse {WarehouseId}",
                renterId, warehouseId);
        }
    }

    // Response models for SePay API
    private class SepayTransactionResponse
    {
        [JsonPropertyName("status")]
        public int Status { get; set; }

        [JsonPropertyName("transactions")]
        public List<SepayTransaction>? Transactions { get; set; }
    }

    private class SepayQueryResult
    {
        public HttpStatusCode? StatusCode { get; set; }
        public List<SepayTransaction> Transactions { get; set; } = new();
        public bool IsRateLimited => StatusCode == HttpStatusCode.TooManyRequests;
    }

    private class SepayTransaction
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("transaction_date")]
        public string? TransactionDate { get; set; }

        [JsonPropertyName("account_number")]
        public string? AccountNumber { get; set; }

        [JsonPropertyName("amount_in")]
        public decimal? AmountIn { get; set; }

        [JsonPropertyName("amount_out")]
        public decimal? AmountOut { get; set; }

        [JsonPropertyName("accumulated")]
        public decimal? Accumulated { get; set; }

        [JsonPropertyName("transaction_content")]
        public string? TransactionContent { get; set; }

        [JsonPropertyName("reference_number")]
        public string? ReferenceNumber { get; set; }

        [JsonPropertyName("bank_brand_name")]
        public string? BankBrandName { get; set; }
    }

}
