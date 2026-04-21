namespace WMS.Application.Features.RentalContracts.Common;

public class RentalContractDto
{
    public int ContractId { get; set; }
    public int RentalRequestId { get; set; }
    public string ContractNumber { get; set; } = null!;
    public int RenterId { get; set; }
    public string RenterName { get; set; } = null!;
    public string RenterEmail { get; set; } = null!;
    public string? RenterPhone { get; set; }
    public string? OwnerName { get; set; }
    public string? OwnerPhone { get; set; }
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = null!;
    public string WarehouseAddress { get; set; } = null!;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal MonthlyPayment { get; set; }
    public decimal TotalValue { get; set; }
    public decimal? DepositAmount { get; set; }
    public string Status { get; set; } = null!;
    public string? Terms { get; set; }
    public string? ContractFileUrl { get; set; }
    public string? SignedFileUrl { get; set; }
    public string? ContractImageUrl { get; set; }
    public DateTime? SignedAt { get; set; }
    public string? OwnerSignedFileUrl { get; set; }
    public DateTime? OwnerSignedAt { get; set; }
    public string? OwnerSignatureBase64 { get; set; }
    public string? RenterSignatureBase64 { get; set; }
    public int? RentalAreaId { get; set; }
    public double RequestedArea { get; set; }
    // Custom area fields
    public bool IsCustomArea { get; set; }
    public double? ProposedPositionX { get; set; }
    public double? ProposedPositionY { get; set; }
    public double? ProposedWidth { get; set; }
    public double? ProposedLength { get; set; }
    public int? BaseRentalAreaId { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsCurrentUserRenter { get; set; }
    public bool IsCurrentUserOwner { get; set; }
    
    // 2-party approval fields
    public string? TerminationRequestedBy { get; set; }
    public DateTime? TerminationRequestedAt { get; set; }
    public bool RenterApprovedTermination { get; set; }
    public bool OwnerApprovedTermination { get; set; }
    public string? TerminationReason { get; set; }
    public decimal? EarlyTerminationFee { get; set; }
}
