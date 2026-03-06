using System;
using System.Collections.Generic;

namespace WMS.Infrastructure.Persistence.ScaffoldModels;

public partial class Rating
{
    public int RatingId { get; set; }

    public int WarehouseId { get; set; }

    public int RenterId { get; set; }

    public int? ContractId { get; set; }

    public int Star { get; set; }

    public string? Comment { get; set; }

    public bool? IsHidden { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Contract? Contract { get; set; }

    public virtual User Renter { get; set; } = null!;

    public virtual Warehouse Warehouse { get; set; } = null!;
}
