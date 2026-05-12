using System;
using System.Collections.Generic;

namespace WMS.Domain.Entities;

public partial class Contract
{
    public int ContractId { get; set; }

    public int RequestId { get; set; }

    public int RenterId { get; set; }

    public int WarehouseId { get; set; }

    public string? ContractUrl { get; set; }

    public string? SignedFileUrl { get; set; }

    public DateTime? SignedAt { get; set; }

    public string? Terms { get; set; }

    public string? ContractNumber { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public string? Status { get; set; }

    public decimal TotalValue { get; set; }

    public decimal? DepositAmount { get; set; }

    public decimal MonthlyPayment { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public string? OwnerSignedFileUrl { get; set; }

    public DateTime? OwnerSignedAt { get; set; }

    public string? OwnerSignatureBase64 { get; set; }

    public string? RenterSignatureBase64 { get; set; }

    public DateTime? TerminatedAt { get; set; }

    public string? TerminationReason { get; set; }

    // Termination/Close approval tracking
    public string? TerminationRequestedBy { get; set; } // "RENTER" or "OWNER"
    public DateTime? TerminationRequestedAt { get; set; }
    public bool RenterApprovedTermination { get; set; }
    public bool OwnerApprovedTermination { get; set; }
    public decimal? EarlyTerminationFee { get; set; }

    public virtual PaymentTerm? PaymentTerm { get; set; }

    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();

    public virtual ICollection<Rating> Ratings { get; set; } = new List<Rating>();

    public virtual RentalRequest Request { get; set; } = null!;

    public virtual User Renter { get; set; } = null!;

    public virtual Warehouse Warehouse { get; set; } = null!;
}
