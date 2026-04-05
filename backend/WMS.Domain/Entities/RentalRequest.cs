using System;
using System.Collections.Generic;

namespace WMS.Domain.Entities;

public partial class RentalRequest
{
    public int RequestId { get; set; }

    public int RenterId { get; set; }

    public int WarehouseId { get; set; }

    public int? RentalAreaId { get; set; }

    public double RequestedArea { get; set; }

    public DateTime StartDate { get; set; }

    public int DurationMonths { get; set; }

    public string Status { get; set; } = "PENDING";

    public string? Notes { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? ReviewedBy { get; set; }

    public DateTime? ReviewedAt { get; set; }

    public string? RejectionReason { get; set; }

    public string? ContractImageUrl { get; set; }
    
    // NEW - Cancel tracking
    public string? CancellationReason { get; set; }
    
    public DateTime? CancelledAt { get; set; }
    
    public string? CancelledBy { get; set; } // USER, OWNER, SYSTEM

    public virtual User Renter { get; set; } = null!;

    public virtual User? ReviewedByNavigation { get; set; }

    public virtual Warehouse Warehouse { get; set; } = null!;
    public virtual RentalArea? RentalArea { get; set; }

    public virtual ICollection<Contract> Contracts { get; set; } = new List<Contract>();

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
            Status = "PENDING",
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

    public void Cancel()
    {
        if (Status != "PENDING" && Status != "APPROVED")
            throw new InvalidOperationException($"Cannot cancel request with status {Status}");

        Status = "CANCELLED";
    }
    
    // NEW - Enhanced cancel with reason and tracking
    public void CancelWithReason(string reason, string cancelledBy = "USER")
    {
        if (Status != "PENDING" && Status != "APPROVED")
            throw new InvalidOperationException($"Cannot cancel request with status {Status}");

        Status = cancelledBy switch
        {
            "USER" => "CANCELLED_BY_USER",
            "OWNER" => "CANCELLED_BY_OWNER",
            "SYSTEM" => "CANCELLED_BY_SYSTEM",
            _ => "CANCELLED"
        };
        
        CancellationReason = reason;
        CancelledAt = DateTime.UtcNow;
        CancelledBy = cancelledBy;
    }

    public void Send()
    {
        if (Status != "PENDING")
            throw new InvalidOperationException($"Cannot send request with status {Status}");
        // Send can be called on PENDING status, just marking it as sent
    }
}
