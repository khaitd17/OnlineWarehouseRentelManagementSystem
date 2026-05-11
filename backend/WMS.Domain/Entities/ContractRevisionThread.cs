namespace WMS.Domain.Entities;

public class ContractRevisionThread
{
    public int ThreadId { get; set; }
    public int ContractId { get; set; }
    public string Section { get; set; } = null!;
    public string Status { get; set; } = "OPEN";
    public int CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int? ResolvedBy { get; set; }
    public DateTime? ResolvedAt { get; set; }

    public virtual Contract Contract { get; set; } = null!;
    public virtual User CreatedByUser { get; set; } = null!;
    public virtual User? ResolvedByUser { get; set; }
    public virtual ICollection<ContractRevisionComment> Comments { get; set; } = new List<ContractRevisionComment>();
}
