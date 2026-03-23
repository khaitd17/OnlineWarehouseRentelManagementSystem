namespace WMS.Domain.Entities;

public class ContractLog
{
    public int LogId { get; set; }
    public int ContractId { get; set; }
    public int UserId { get; set; }
    public string Action { get; set; } = null!;
    public string? IpAddress { get; set; }
    public string? Details { get; set; }
    public DateTime? CreatedAt { get; set; }
}
