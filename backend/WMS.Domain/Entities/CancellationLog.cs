using System.ComponentModel.DataAnnotations;

namespace WMS.Domain.Entities;

public class CancellationLog
{
    private CancellationLog() { } // For EF Core
    
    [Key]
    public int LogId { get; private set; }
    public int? RentalRequestId { get; private set; }
    public int? RentalContractId { get; private set; }
    public string CancelledStage { get; private set; } = null!; // PENDING, CONTRACT, PAYMENT
    public string CancelledBy { get; private set; } = null!; // USER, OWNER, SYSTEM
    public string CancellationReason { get; private set; } = null!;
    public decimal? RefundAmount { get; private set; }
    public decimal? CancellationFee { get; private set; }
    public DateTime CreatedAt { get; private set; }
    
    // Navigation properties
    public RentalRequest? RentalRequest { get; set; }
    public RentalContract? RentalContract { get; set; }
    
    // Factory method
    public static CancellationLog Create(
        int? rentalRequestId,
        int? rentalContractId,
        string cancelledStage,
        string cancelledBy,
        string cancellationReason,
        decimal? refundAmount = null,
        decimal? cancellationFee = null)
    {
        if (rentalRequestId == null && rentalContractId == null)
            throw new ArgumentException("Either RentalRequestId or RentalContractId must be provided");
            
        if (string.IsNullOrWhiteSpace(cancelledStage))
            throw new ArgumentException("CancelledStage is required", nameof(cancelledStage));
            
        if (string.IsNullOrWhiteSpace(cancelledBy))
            throw new ArgumentException("CancelledBy is required", nameof(cancelledBy));
            
        if (string.IsNullOrWhiteSpace(cancellationReason))
            throw new ArgumentException("CancellationReason is required", nameof(cancellationReason));
        
        return new CancellationLog
        {
            RentalRequestId = rentalRequestId,
            RentalContractId = rentalContractId,
            CancelledStage = cancelledStage,
            CancelledBy = cancelledBy,
            CancellationReason = cancellationReason,
            RefundAmount = refundAmount,
            CancellationFee = cancellationFee,
            CreatedAt = DateTime.UtcNow
        };
    }
}
