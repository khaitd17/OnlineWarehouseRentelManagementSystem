using System.ComponentModel.DataAnnotations;

namespace WMS.Domain.Entities;

public class Refund
{
    private Refund() { } // For EF Core
    
    [Key]
    public int RefundId { get; private set; }
    public int? PaymentId { get; private set; }
    public int ContractId { get; private set; }
    public decimal Amount { get; private set; }
    public string Reason { get; private set; } = null!;
    public string Status { get; private set; } = "PENDING"; // PENDING, PROCESSING, COMPLETED, FAILED
    public DateTime? ProcessedAt { get; private set; }
    public DateTime CreatedAt { get; private set; }
    
    // Navigation properties
    public RentalPayment? Payment { get; set; }
    public RentalContract? Contract { get; set; }
    
    // Factory method
    public static Refund Create(
        int? paymentId,
        int contractId,
        decimal amount,
        string reason)
    {
        if (amount <= 0)
            throw new ArgumentException("Refund amount must be positive", nameof(amount));
            
        if (string.IsNullOrWhiteSpace(reason))
            throw new ArgumentException("Refund reason is required", nameof(reason));
        
        return new Refund
        {
            PaymentId = paymentId,
            ContractId = contractId,
            Amount = amount,
            Reason = reason,
            Status = "PENDING",
            CreatedAt = DateTime.UtcNow
        };
    }
    
    // Domain methods
    public void MarkProcessing()
    {
        if (Status != "PENDING")
            throw new InvalidOperationException($"Cannot mark processing refund with status {Status}");
            
        Status = "PROCESSING";
    }
    
    public void MarkCompleted()
    {
        if (Status != "PROCESSING" && Status != "PENDING")
            throw new InvalidOperationException($"Cannot complete refund with status {Status}");
            
        Status = "COMPLETED";
        ProcessedAt = DateTime.UtcNow;
    }
    
    public void MarkFailed()
    {
        if (Status == "COMPLETED")
            throw new InvalidOperationException("Cannot fail completed refund");
            
        Status = "FAILED";
    }
}
