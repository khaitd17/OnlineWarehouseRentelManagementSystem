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

    public virtual Warehouse Warehouse { get; set; } = null!;
}
