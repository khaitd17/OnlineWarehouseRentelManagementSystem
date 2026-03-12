using System;
using System.Collections.Generic;

namespace WMS.Domain.Entities;

public partial class WarehouseMedium
{
    public int MediaId { get; set; }

    public int WarehouseId { get; set; }

    public string MediaUrl { get; set; } = null!;

    public string MediaType { get; set; } = null!;

    public int? DisplayOrder { get; set; }

    public bool? IsPrimary { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual Warehouse Warehouse { get; set; } = null!;
}
