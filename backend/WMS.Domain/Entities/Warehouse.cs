namespace WMS.Domain.Entities;

public class Warehouse
{
    public int Id { get; private set; }

    public string Name { get; private set; } = null!;
    public string Description { get; private set; } = null!;
    public string Address { get; private set; } = null!;
    public string City { get; private set; } = null!;
    public string Province { get; private set; } = null!;
    public string WarehouseType { get; private set; } = null!;
    public string Status { get; private set; } = null!;

    public double Area { get; private set; }
    public decimal PricePerMonth { get; private set; }
    public int Capacity { get; private set; }
    public int OwnerId { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private Warehouse() { } // EF Core

    public Warehouse(
        string name,
        string description,
        string address,
        string city,
        string province,
        double area,
        decimal pricePerMonth,
        string warehouseType,
        int capacity,
        int ownerId)
    {
        Name = name;
        Description = description;
        Address = address;
        City = city;
        Province = province;
        Area = area;
        PricePerMonth = pricePerMonth;
        WarehouseType = warehouseType;
        Capacity = capacity;
        OwnerId = ownerId;

        Status = "PENDING";
        CreatedAt = DateTime.UtcNow;
    }
}