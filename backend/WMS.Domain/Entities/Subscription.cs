using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace WMS.Domain.Entities;

public enum SubscriptionPlan
{
    Basic,
    Premium
}

public enum SubscriptionStatus
{
    Pending,
    Active,
    Expired,
    Cancelled
}

public partial class Subscription
{
    public int SubscriptionId { get; set; }

    public int UserId { get; set; }

    public SubscriptionPlan Plan { get; set; }

    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Pending;

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public string? TransactionReference { get; set; }

    public virtual User? User { get; set; }
}
