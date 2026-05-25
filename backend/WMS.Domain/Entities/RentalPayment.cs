using WMS.Domain.Enums;

namespace WMS.Domain.Entities;

public class RentalPayment
{
    private RentalPayment() { } // For EF Core

    public int PaymentId { get; private set; }
    public int ContractId { get; private set; }
    public decimal Amount { get; private set; }
    public string PaymentType { get; private set; } = "DEPOSIT";
    public string Status { get; set; } = "PENDING";
    public string PaymentCode { get; private set; } = null!; // Unique code: WMS{PaymentId}
    public string PaymentMethod { get; set; } = "BANK_TRANSFER"; // BANK_TRANSFER, CASH
    public int? SepayTransactionId { get; private set; }
    public string? SepayReferenceCode { get; private set; }
    public string? TransactionCode { get; set; }
    public string? ProofUrl { get; set; }
    public string? ProofNote { get; set; }
    public DateTime? ProofSubmittedAt { get; set; }
    public string? ProofRequestReason { get; set; }
    public DateTime? ProofRequestedAt { get; set; }
    public DateTime? PaidAt { get; private set; }
    public DateTime? ExpiredAt { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }
    
    // NEW - Billing Period Tracking
    public DateTime? TermStartDate { get; private set; }
    public DateTime? TermEndDate { get; private set; }
    
    // NEW - Retry tracking
    public int RetryCount { get; private set; } = 0;
    public int MaxRetry { get; private set; } = 3;
    public DateTime? LastRetryAt { get; private set; }

    // Navigation properties - maps to 'contracts' table (not rental_contracts)
    public Contract? Contract { get; set; }

    // Factory method
    public static RentalPayment Create(
        int contractId,
        decimal amount,
        string paymentType,
        double expiryHours = 48,
        DateTime? termStartDate = null,
        DateTime? termEndDate = null)
    {
        // Use GUID-based temp code — guaranteed unique even with concurrent requests
        // Will be replaced with WMS{paymentId:D6} after DB insert
        var tempCode = $"TMP{Guid.NewGuid():N}".Substring(0, 20);

        var payment = new RentalPayment
        {
            ContractId = contractId,
            Amount = amount,
            PaymentType = paymentType,
            Status = PaymentStatus.Pending,
            PaymentCode = tempCode,
            ExpiredAt = DateTime.UtcNow.AddHours(expiryHours),
            CreatedAt = DateTime.UtcNow,
            TermStartDate = termStartDate,
            TermEndDate = termEndDate
        };

        return payment;
    }

    // Set payment code after insert (need PaymentId)
    public void SetPaymentCode()
    {
        PaymentCode = $"WMS{PaymentId:D6}";
        UpdatedAt = DateTime.UtcNow;
    }

    // Update expiry time safely
    public void UpdateExpiry(DateTime maxAllowedExpiry)
    {
        ExpiredAt = maxAllowedExpiry;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetPaymentCode(string code)
    {
        PaymentCode = code;
        UpdatedAt = DateTime.UtcNow;
    }

    // Mark as processing
    public void MarkProcessing()
    {
        if (Status != PaymentStatus.Pending)
            throw new InvalidOperationException($"Cannot mark processing for payment with status {Status}");

        Status = PaymentStatus.Processing;
        UpdatedAt = DateTime.UtcNow;
    }

    // Complete payment from SePay webhook
    public void CompleteFromSepay(int sepayTransactionId, string referenceCode)
    {
        if (Status == PaymentStatus.Completed)
            return; // Idempotent

        Status = PaymentStatus.Completed;
        SepayTransactionId = sepayTransactionId;
        SepayReferenceCode = referenceCode;
        PaidAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    // Mark as failed
    public void MarkFailed()
    {
        Status = PaymentStatus.Failed;
        UpdatedAt = DateTime.UtcNow;
    }

    // Mark as cancelled
    public void MarkCancelled()
    {
        if (Status == PaymentStatus.Completed)
            throw new InvalidOperationException("Cannot cancel completed payment");

        Status = PaymentStatus.Cancelled;
        UpdatedAt = DateTime.UtcNow;
    }

    // Mark as expired
    public void MarkExpired()
    {
        if (Status != PaymentStatus.Pending)
            throw new InvalidOperationException($"Cannot expire payment with status {Status}");

        Status = PaymentStatus.Expired;
        UpdatedAt = DateTime.UtcNow;
    }

    // Check if payment is expired
    public bool IsExpired => ExpiredAt.HasValue && DateTime.UtcNow > ExpiredAt.Value && Status == PaymentStatus.Pending;

    // Check if payment is completed
    public bool IsCompleted => Status == PaymentStatus.Completed;

    // Check if payment is pending
    public bool IsPending => Status == PaymentStatus.Pending;

    public void UpdatePaymentProof(string? transactionCode, string? proofUrl, string? proofNote)
    {
        TransactionCode = transactionCode;
        ProofUrl = proofUrl;
        ProofNote = proofNote;
        ProofSubmittedAt = DateTime.UtcNow;
        ProofRequestReason = null;
        ProofRequestedAt = null;
        UpdatedAt = DateTime.UtcNow;
    }

    public void RequestProofReupload(string? reason)
    {
        Status = PaymentStatus.ReuploadRequested;
        ProofRequestReason = reason;
        ProofRequestedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }
    
    // NEW - Retry methods
    public void IncrementRetry()
    {
        if (RetryCount >= MaxRetry)
            throw new InvalidOperationException($"Maximum retry attempts ({MaxRetry}) reached");
            
        RetryCount++;
        LastRetryAt = DateTime.UtcNow;
        Status = PaymentStatus.Pending; // Reset to pending for retry
        UpdatedAt = DateTime.UtcNow;
    }
    
    public bool CanRetry => RetryCount < MaxRetry && (Status == PaymentStatus.Failed || Status == PaymentStatus.Expired);
}
