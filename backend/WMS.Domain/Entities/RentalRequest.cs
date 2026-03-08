namespace WMS.Domain.Entities;

public class RentalRequest
{
    private RentalRequest() { } // For EF Core

    public int RequestId { get; private set; }
    public int RenterId { get; private set; }
    public int WarehouseId { get; private set; }
    public double RequestedArea { get; private set; }
    public DateTime StartDate { get; private set; }
    public int DurationMonths { get; private set; }
    public string Status { get; private set; } = "DRAFT";
    public string? Notes { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public int? ReviewedBy { get; private set; }
    public DateTime? ReviewedAt { get; private set; }
    public string? RejectionReason { get; private set; }
    public string? ContractImageUrl { get; private set; }

    // Navigation properties
    public Warehouse? Warehouse { get; set; }

    // Factory method
    public static RentalRequest Create(
        int renterId,
        int warehouseId,
        double requestedArea,
        DateTime startDate,
        int durationMonths,
        string? notes)
    {
        return new RentalRequest
        {
            RenterId = renterId,
            WarehouseId = warehouseId,
            RequestedArea = requestedArea,
            StartDate = startDate,
            DurationMonths = durationMonths,
            Notes = notes,
            Status = "DRAFT",
            CreatedAt = DateTime.UtcNow
        };
    }

    // Domain methods
    public void Approve(int reviewerId, string? contractImageUrl = null)
    {
        if (Status != "PENDING")
            throw new InvalidOperationException($"Cannot approve request with status {Status}");

        Status = "APPROVED";
        ReviewedBy = reviewerId;
        ReviewedAt = DateTime.UtcNow;
        ContractImageUrl = contractImageUrl;
    }

    public void Cancel(int renterId)
    {
        if (RenterId != renterId)
            throw new UnauthorizedAccessException("Only the renter can cancel this request");

        if (Status != "PENDING" && Status != "APPROVED")
            throw new InvalidOperationException($"Cannot cancel request with status {Status}");

        Status = "CANCELLED";
    }

    public void Reject(int reviewerId, string rejectionReason)
    {
        if (Status != "PENDING")
            throw new InvalidOperationException($"Cannot reject request with status {Status}");

        if (string.IsNullOrWhiteSpace(rejectionReason))
            throw new ArgumentException("Rejection reason is required", nameof(rejectionReason));

        Status = "REJECTED";
        ReviewedBy = reviewerId;
        ReviewedAt = DateTime.UtcNow;
        RejectionReason = rejectionReason;
    }

    public bool IsPending => Status == "PENDING";
    public bool IsApproved => Status == "APPROVED";
    public bool IsRejected => Status == "REJECTED";
    public bool IsDraft => Status == "DRAFT";

    public void Send()
    {
        if (Status != "DRAFT")
            throw new InvalidOperationException($"Cannot send request with status {Status}");
        
        Status = "PENDING";
    }
}
