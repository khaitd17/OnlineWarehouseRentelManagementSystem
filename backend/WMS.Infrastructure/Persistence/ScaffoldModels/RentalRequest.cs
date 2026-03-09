using System;
using System.Collections.Generic;

namespace WMS.Infrastructure.Persistence.ScaffoldModels;

public partial class RentalRequest
{
    public int RequestId { get; set; }

    public int RenterId { get; set; }

    public int WarehouseId { get; set; }

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

    public virtual User Renter { get; set; } = null!;

    public virtual User? ReviewedByNavigation { get; set; }

    public virtual Warehouse Warehouse { get; set; } = null!;

    public virtual ICollection<Contract> Contracts { get; set; } = new List<Contract>();
}
