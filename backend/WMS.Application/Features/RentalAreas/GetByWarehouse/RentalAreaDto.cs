namespace WMS.Application.Features.RentalAreas.GetByWarehouse;

public class RentalAreaDto
{
    public int Id { get; set; }
    public int WarehouseId { get; set; }
    public string Name { get; set; } = null!;
    public double Size { get; set; }
    public string? Description { get; set; }
    public double? PositionX { get; set; }
    public double? PositionY { get; set; }
    public double? Width { get; set; }
    public double? Length { get; set; }
    /// <summary>True nếu ô khu đang được thuê bởi hợp đồng ACTIVE / PENDING_PAYMENT.</summary>
    public bool IsOccupied { get; set; }
    /// <summary>ContractId đang thuê (nếu có).</summary>
    public int? ActiveContractId { get; set; }
}
