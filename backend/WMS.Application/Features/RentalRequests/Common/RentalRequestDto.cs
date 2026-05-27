namespace WMS.Application.Features.RentalRequests.Common;

public class RentalRequestDto
{
    public int RequestId { get; set; }
    public int RenterId { get; set; }
    public string RenterName { get; set; } = null!;
    public string RenterEmail { get; set; } = null!;
    public string? RenterPhone { get; set; }
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = null!;
    public string WarehouseAddress { get; set; } = null!;
    public double RequestedArea { get; set; }
    public DateTime StartDate { get; set; }
    public int DurationMonths { get; set; }
    public string Status { get; set; } = null!;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public int? ReviewedBy { get; set; }
    public string? ReviewedByName { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? RejectionReason { get; set; }
    public string? ContractImageUrl { get; set; }
    public int? ContractId { get; set; }
    public string? ContractStatus { get; set; }
    public string? OwnerName { get; set; }
    public string? OwnerEmail { get; set; }
    public string? OwnerPhone { get; set; }
    public int? RentalAreaId { get; set; }
    public string? RentalAreaName { get; set; }
    public double? RentalAreaSize { get; set; }

    // Custom Area (renter self-arranged or owner-assigned)
    public bool IsCustomArea { get; set; }
    public bool IsOwnerAssigned { get; set; }
    public double? ProposedPositionX { get; set; }
    public double? ProposedPositionY { get; set; }
    public double? ProposedWidth { get; set; }
    public double? ProposedLength { get; set; }
    public int? BaseRentalAreaId { get; set; }

    // Extension zone (L-shape: primary + extension rectangle)
    public bool HasExtensionZone { get; set; }
    public double? ExtensionPositionX { get; set; }
    public double? ExtensionPositionY { get; set; }
    public double? ExtensionWidth { get; set; }
    public double? ExtensionLength { get; set; }

    // Multi-zone (additional non-adjacent rectangles as JSON array)
    public string? AdditionalZonesJson { get; set; }

    // Pricing for prioritization
    public decimal? MonthlyPayment { get; set; }
    public decimal? TotalValue { get; set; }
}
