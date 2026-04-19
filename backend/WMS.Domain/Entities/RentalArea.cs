using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WMS.Domain.Entities;

[Table("rental_areas")]
public partial class RentalArea
{
    [Key]
    [Column("rental_area_id")]
    public int Id { get; set; }

    [Column("warehouse_id")]
    public int WarehouseId { get; set; }

    [Column("name")]
    public string Name { get; set; } = null!;

    [Column("size")]
    public double Size { get; set; }
    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public double? PositionX { get; set; }

    public double? PositionY { get; set; }

    public double? Width { get; set; }

    public double? Length { get; set; }
    public virtual Warehouse Warehouse { get; set; } = null!;
    public virtual ICollection<Equipment> Equipments { get; set; } = new List<Equipment>();

    // ── Computed (not stored in DB) ──────────────────────────────────────
    [NotMapped]
    public bool IsOccupied { get; set; }

    [NotMapped]
    public int? ActiveContractId { get; set; }
}
