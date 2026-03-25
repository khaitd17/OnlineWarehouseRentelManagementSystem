namespace WMS.Domain.Entities;

/// <summary>
/// Đơn vị công việc con thuộc một WarehouseTask.
/// </summary>
public class UnitTask
{
    public int Id { get; set; }
    public int WarehouseTaskId { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public WarehouseTask WarehouseTask { get; set; } = null!;
}
