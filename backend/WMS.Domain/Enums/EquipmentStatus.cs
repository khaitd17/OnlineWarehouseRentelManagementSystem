namespace WMS.Domain.Enums;

public static class EquipmentStatus
{
    public const string Available = "AVAILABLE";
    public const string InUse = "IN_USE";
    public const string Maintenance = "MAINTENANCE";
    public const string Broken = "BROKEN";
    public const string Retired = "RETIRED";
}

public static class EquipmentCategory
{
    public const string Warehouse = "WAREHOUSE";
    public const string RentalArea = "RENTAL_AREA";
}
