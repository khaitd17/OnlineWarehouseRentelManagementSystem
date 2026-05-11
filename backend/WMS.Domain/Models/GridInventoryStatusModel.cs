namespace WMS.Domain.Models;

public class GridInventoryStatusModel
{
    public int? AssetId { get; set; }
    public string ItemName { get; set; } = null!;
    public int? RenterId { get; set; }
    public string? RenterName { get; set; }
    public string Unit { get; set; } = "cái";
    
    public int InventoryQuantity { get; set; }
    public int AssignedQuantity { get; set; }
    
    // Computed fields
    public int UnassignedQuantity => System.Math.Max(0, InventoryQuantity - AssignedQuantity);
    public int ExcessQuantity => System.Math.Max(0, AssignedQuantity - InventoryQuantity);
}
