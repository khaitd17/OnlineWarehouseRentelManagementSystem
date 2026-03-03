namespace WMS.Domain.Entities;

public class RentalRequest
{
    public int Id { get; private set; }

    public int RenterId { get; private set; }
    public int WarehouseId { get; private set; }
    public double RequestedArea { get; private set; }
    public int DurationMonths { get; private set; }
    
    public string Status { get; private set; } = null!;
    public string? Notes { get; private set; }
    
    public DateTime CreatedAt { get; private set; }
    public DateTime? ApprovedAt { get; private set; }
    public DateTime? RejectedAt { get; private set; }
    public string? RejectionReason { get; private set; }
    public int? ReviewedBy { get; private set; }

    // Navigation Property
    public Warehouse Warehouse { get; private set; } = null!;

    private RentalRequest() { } // EF Core

    public RentalRequest(
        int renterId,
        int warehouseId,
        double requestedArea,
        int durationMonths,
        string? notes = null)
    {
        RenterId = renterId;
        WarehouseId = warehouseId;
        RequestedArea = requestedArea;
        DurationMonths = durationMonths;
        Notes = notes;
        
        Status = "PENDING";
        CreatedAt = DateTime.UtcNow;
    }

    public void Approve(int reviewerId)
    {
        if (Status != "PENDING")
            throw new InvalidOperationException("Only pending requests can be approved.");

        Status = "APPROVED";
        ApprovedAt = DateTime.UtcNow;
        ReviewedBy = reviewerId;
    }

    public void Reject(int reviewerId, string reason)
    {
        if (Status != "PENDING")
            throw new InvalidOperationException("Only pending requests can be rejected.");

        if (string.IsNullOrWhiteSpace(reason))
            throw new ArgumentException("Rejection reason is required.", nameof(reason));

        Status = "REJECTED";
        RejectedAt = DateTime.UtcNow;
        RejectionReason = reason;
        ReviewedBy = reviewerId;
    }
}
