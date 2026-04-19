namespace WMS.Application.Features.RentalRequests.Common;

public class RentalRequestDto
{
    public int RequestId { get; set; }
    public int RenterId { get; set; }
    public string RenterName { get; set; } = null!;
    public string RenterEmail { get; set; } = null!;
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
    public int? ContractId { get; set; }  // ID of the contract created when request is approved
    public string? ContractStatus { get; set; }  // Contract status if exists
    public string? OwnerName { get; set; }
    public string? OwnerEmail { get; set; }
    public string? OwnerPhone { get; set; }
    public int? RentalAreaId { get; set; }
    public string? RentalAreaName { get; set; }
    public double? RentalAreaSize { get; set; }
}
