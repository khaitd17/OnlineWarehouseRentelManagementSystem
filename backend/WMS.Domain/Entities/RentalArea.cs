using System;
using System.ComponentModel.DataAnnotations;

namespace WMS.Domain.Entities;

public partial class RentalArea
{
    public int Id { get; set; }

    public int WarehouseId { get; set; }

    public string Name { get; set; } = null!;

    public double Size { get; set; }

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public double? PositionX { get; set; }

    public double? PositionY { get; set; }

    public double? Width { get; set; }

    public double? Length { get; set; }
    public virtual Warehouse Warehouse { get; set; } = null!;
    public virtual ICollection<Equipment> Equipments { get; set; } = new List<Equipment>();
}
