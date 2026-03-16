using System;
using System.Collections.Generic;

namespace WMS.Domain.Entities;

public partial class AuditResult
{
    public int ResultId { get; set; }

    public int AuditId { get; set; }

    public string ItemName { get; set; } = null!;

    public int ExpectedQty { get; set; }

    public int ActualQty { get; set; }

    public int? Discrepancy { get; set; }

    public string? DiscrepancyReason { get; set; }

    public DateTime? CreatedAt { get; set; }

    public int? RecordedBy { get; set; }

    public virtual AuditSession Audit { get; set; } = null!;

    public virtual User? RecordedByNavigation { get; set; }
}
