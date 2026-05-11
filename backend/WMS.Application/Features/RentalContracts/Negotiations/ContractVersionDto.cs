namespace WMS.Application.Features.RentalContracts.Negotiations;

public class ContractVersionDto
{
    public int VersionId { get; set; }
    public int ContractId { get; set; }
    public int VersionNumber { get; set; }
    public string SnapshotJson { get; set; } = null!;
    public int CreatedBy { get; set; }
    public string CreatedByName { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}
