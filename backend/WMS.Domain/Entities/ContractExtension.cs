using WMS.Domain.Enums;

namespace WMS.Domain.Entities;

public class ContractExtension
{
    private ContractExtension() { } // For EF Core

    public int ExtensionId { get; private set; }
    public int OriginalContractId { get; private set; }
    public int? NewContractId { get; private set; }
    public int RequesterId { get; private set; }
    public int DurationMonths { get; private set; }
    public decimal? ProposedMonthlyPayment { get; private set; }
    public string Status { get; private set; } = ContractExtensionStatus.Pending;
    public string? Notes { get; private set; }
    public string? RejectionReason { get; private set; }
    public DateTime RequestedAt { get; private set; }
    public DateTime? ReviewedAt { get; private set; }
    public int? ReviewedBy { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    // Navigation properties
    public Contract? OriginalContract { get; set; }
    public Contract? NewContract { get; set; }
    public User? Requester { get; set; }
    public User? Reviewer { get; set; }

    // Factory method
    public static ContractExtension Create(
        int originalContractId,
        int requesterId,
        int durationMonths,
        decimal? proposedMonthlyPayment = null,
        string? notes = null)
    {
        return new ContractExtension
        {
            OriginalContractId = originalContractId,
            RequesterId = requesterId,
            DurationMonths = durationMonths,
            ProposedMonthlyPayment = proposedMonthlyPayment,
            Notes = notes,
            Status = ContractExtensionStatus.Pending,
            RequestedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
    }

    // Approve extension
    public void Approve(int reviewedBy, decimal approvedMonthlyPayment)
    {
        if (Status != ContractExtensionStatus.Pending)
            throw new InvalidOperationException($"Cannot approve extension with status {Status}");

        Status = ContractExtensionStatus.Approved;
        ReviewedBy = reviewedBy;
        ReviewedAt = DateTime.UtcNow;
        ProposedMonthlyPayment = approvedMonthlyPayment;
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkPendingPayment()
    {
        if (Status != ContractExtensionStatus.Approved)
            throw new InvalidOperationException($"Cannot mark pending payment for extension with status {Status}");

        Status = ContractExtensionStatus.PendingPayment;
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkCompleted()
    {
        if (Status != ContractExtensionStatus.PendingPayment)
            throw new InvalidOperationException($"Cannot complete extension with status {Status}");

        Status = ContractExtensionStatus.Completed;
        UpdatedAt = DateTime.UtcNow;
    }

    // Reject extension
    public void Reject(int reviewedBy, string reason)
    {
        if (Status != ContractExtensionStatus.Pending)
            throw new InvalidOperationException($"Cannot reject extension with status {Status}");

        Status = ContractExtensionStatus.Rejected;
        ReviewedBy = reviewedBy;
        ReviewedAt = DateTime.UtcNow;
        RejectionReason = reason;
        UpdatedAt = DateTime.UtcNow;
    }

    // Cancel extension (by requester) - works from Pending or PendingPayment
    public void Cancel()
    {
        if (Status != ContractExtensionStatus.Pending && Status != ContractExtensionStatus.PendingPayment)
            throw new InvalidOperationException($"Cannot cancel extension with status {Status}");

        Status = ContractExtensionStatus.Cancelled;
        UpdatedAt = DateTime.UtcNow;
    }

    public void DeclineOffer()
    {
        if (Status != ContractExtensionStatus.Approved)
            throw new InvalidOperationException($"Cannot decline extension offer with status {Status}");

        Status = ContractExtensionStatus.Cancelled;
        UpdatedAt = DateTime.UtcNow;
    }

    // Check status
    public bool IsPending => Status == ContractExtensionStatus.Pending;
    public bool IsApproved => Status == ContractExtensionStatus.Approved;
    public bool IsPendingPayment => Status == ContractExtensionStatus.PendingPayment;
    public bool IsCompleted => Status == ContractExtensionStatus.Completed;
    public bool IsRejected => Status == ContractExtensionStatus.Rejected;
    public bool IsCancelled => Status == ContractExtensionStatus.Cancelled;
}
