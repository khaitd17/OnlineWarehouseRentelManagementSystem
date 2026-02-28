namespace WMS.Domain.Constants;

public static class UserStatus
{
    public const string ACTIVE = "ACTIVE";
    public const string INACTIVE = "INACTIVE";
    public const string PENDING = "PENDING";
    public const string SUSPENDED = "SUSPENDED";

    public static bool IsValid(string status)
    {
        return new[] { ACTIVE, INACTIVE, PENDING, SUSPENDED }.Contains(status.ToUpper());
    }
}

public static class WarehouseStatus
{
    public const string PENDING = "PENDING";
    public const string APPROVED = "APPROVED";
    public const string REJECTED = "REJECTED";
    public const string ACTIVE = "ACTIVE";
    public const string INACTIVE = "INACTIVE";

    public static bool IsValid(string status)
    {
        return new[] { PENDING, APPROVED, REJECTED, ACTIVE, INACTIVE }.Contains(status.ToUpper());
    }
}
