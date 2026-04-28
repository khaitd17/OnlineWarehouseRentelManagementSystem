using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using WMS.Domain.Exceptions;

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
    
    // ── Custom Area (renter self-arranges zone) ────────────────────────────
    /// <summary>
    /// true if the renter proposed a custom zone position/size on submission.
    /// When false (or null), the owner arranges the zone as before.
    /// </summary>
    public bool IsCustomArea { get; set; } = false;

    /// <summary>
    /// true if the zone was assigned by the warehouse owner during approval.
    /// false means the renter proposed/drew the zone themselves.
    /// </summary>
    public bool IsOwnerAssigned { get; set; } = false;

    /// <summary>X offset (metres) from warehouse origin for the proposed zone.</summary>
    public double? ProposedPositionX { get; set; }

    /// <summary>Y offset (metres) from warehouse origin for the proposed zone.</summary>
    public double? ProposedPositionY { get; set; }

    /// <summary>Width (metres) of the proposed zone.</summary>
    public double? ProposedWidth { get; set; }

    /// <summary>Length/depth (metres) of the proposed zone.</summary>
    public double? ProposedLength { get; set; }

    /// <summary>
    /// If the renter carved out a portion of an existing RentalArea,
    /// this holds the ID of that source area so we can shrink it on activation.
    /// </summary>
    public int? BaseRentalAreaId { get; set; }

    // ── Extension Zone (L-shaped layout: primary + extension) ──────────────
    /// <summary>True when a second extension rectangle supplements the primary zone.</summary>
    [Column("has_extension_zone")]
    public bool HasExtensionZone { get; set; } = false;

    /// <summary>X offset (metres) of the extension zone from warehouse origin.</summary>
    [Column("extension_position_x")]
    public double? ExtensionPositionX { get; set; }

    /// <summary>Y offset (metres) of the extension zone from warehouse origin.</summary>
    [Column("extension_position_y")]
    public double? ExtensionPositionY { get; set; }

    /// <summary>Width (metres) of the extension zone.</summary>
    [Column("extension_width")]
    public double? ExtensionWidth { get; set; }

    /// <summary>Length/depth (metres) of the extension zone.</summary>
    [Column("extension_length")]
    public double? ExtensionLength { get; set; }
    // ──────────────────────────────────────────────────────────────────────

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
            throw new InvalidStateException($"Cannot approve request with status {Status}");

        Status = "APPROVED";
        ReviewedBy = reviewerId;
        ReviewedAt = DateTime.UtcNow;
        ContractImageUrl = contractImageUrl;
    }

    public void Reject(int reviewerId, string rejectionReason)
    {
        if (Status != "PENDING")
            throw new InvalidStateException($"Cannot reject request with status {Status}");

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
