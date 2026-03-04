using System;
using System.Collections.Generic;

namespace WMS.Infrastructure.Persistence.ScaffoldModels;

public partial class Payment
{
    public int PaymentId { get; set; }

    public int ContractId { get; set; }

    public decimal Amount { get; set; }

    public string? PaymentPeriod { get; set; }

    public DateTime? PaymentDate { get; set; }

    public DateOnly? DueDate { get; set; }

    public string? PaymentMethod { get; set; }

    public string? Status { get; set; }

    public string? TransactionReference { get; set; }

    public string? Notes { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual Contract Contract { get; set; } = null!;
}
