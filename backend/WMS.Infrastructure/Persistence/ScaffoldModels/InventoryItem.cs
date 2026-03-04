using System;
using System.Collections.Generic;

namespace WMS.Infrastructure.Persistence.ScaffoldModels;

public partial class InventoryItem
{
    public int ItemId { get; set; }

    public int InvReqId { get; set; }

    public string ItemName { get; set; } = null!;

    public int Quantity { get; set; }

    public string Unit { get; set; } = null!;

    public decimal? Weight { get; set; }

    public string? Description { get; set; }

    public virtual InventoryRequest InvReq { get; set; } = null!;
}
