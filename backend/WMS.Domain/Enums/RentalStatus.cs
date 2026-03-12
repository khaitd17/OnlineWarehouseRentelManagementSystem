namespace WMS.Domain.Enums;

public static class RentalRequestStatus
{
    public const string Pending = "PENDING";
    public const string Approved = "APPROVED";
    public const string Rejected = "REJECTED";
}

public static class RentalContractStatus
{
    public const string Draft = "DRAFT";
    public const string Active = "ACTIVE";
    public const string Expired = "EXPIRED";
    public const string Terminated = "TERMINATED";
}
