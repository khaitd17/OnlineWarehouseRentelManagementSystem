namespace WMS.Domain.Entities;

public class ContractVersion
{
    public int VersionId { get; set; }
    public int ContractId { get; set; }
    public int VersionNumber { get; set; }
    public string SnapshotJson { get; set; } = null!;
    public int CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }

    public virtual Contract Contract { get; set; } = null!;
    public virtual User CreatedByUser { get; set; } = null!;
}
