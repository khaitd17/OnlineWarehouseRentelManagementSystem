namespace WMS.Domain.Entities;

public class UnitTask
{
    public int Id { get; set; }
    public int WarehouseTaskId { get; set; }
    public string? UnitTaskTypeCode { get; set; }
    public int Order { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public int? CompletedBy { get; set; }

    public WarehouseTask WarehouseTask { get; set; } = null!;
    public User? CompletedByUser { get; set; }
}
