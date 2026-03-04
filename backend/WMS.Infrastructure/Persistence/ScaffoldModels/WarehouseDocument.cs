using System;
using System.Collections.Generic;

namespace WMS.Infrastructure.Persistence.ScaffoldModels;

public partial class WarehouseDocument
{
    public int DocumentId { get; set; }

    public int WarehouseId { get; set; }

    public string DocumentType { get; set; } = null!;

    public string DocumentUrl { get; set; } = null!;

    public string? DocumentNumber { get; set; }

    public DateOnly? IssuedDate { get; set; }

    public DateOnly? ExpiryDate { get; set; }

    public string? Status { get; set; }

    public int? VerifiedBy { get; set; }

    public DateTime? VerifiedAt { get; set; }

    public string? RejectionReason { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual User? VerifiedByNavigation { get; set; }

    public virtual Warehouse Warehouse { get; set; } = null!;
}
