using System;
using System.Collections.Generic;

namespace WMS.Infrastructure.Persistence.ScaffoldModels;

public partial class RentalArea
{
    public int AreaId { get; set; }

    public int WarehouseId { get; set; }

    public int? RenterId { get; set; }

    public double AreaSize { get; set; }

    public decimal PricePerMonth { get; set; }

    public string? Status { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? CancelledAt { get; set; }

    public string? CancellationReason { get; set; }

    public virtual ICollection<Contract> Contracts { get; set; } = new List<Contract>();

    public virtual ICollection<InventoryRequest> InventoryRequests { get; set; } = new List<InventoryRequest>();

    public virtual User? Renter { get; set; }

    public virtual Warehouse Warehouse { get; set; } = null!;
}
