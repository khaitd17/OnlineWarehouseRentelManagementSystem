namespace WMS.Domain.Enums;

public static class RentalRequestStatus
{
    public const string Pending = "PENDING";
    public const string Approved = "APPROVED";
    public const string Rejected = "REJECTED";
    public const string Cancelled = "CANCELLED";
}

public static class RentalContractStatus
{
    // Existing
    public const string Draft = "DRAFT";
    public const string PendingOwnerSignature = "PENDING_OWNER_SIGNATURE";
    public const string PendingSignature = "PENDING_SIGNATURE";
    public const string Active = "ACTIVE";
    public const string Expired = "EXPIRED";
    public const string Terminated = "TERMINATED";

    // NEW - Luồng thanh toán
    public const string Signed = "SIGNED";
    public const string PendingPayment = "PENDING_PAYMENT";
    public const string PaymentFailed = "PAYMENT_FAILED";

    // NEW - Hoàn tất hợp đồng
    public const string Completed = "COMPLETED";
    public const string Closed = "CLOSED";
    public const string Overdue = "OVERDUE";
    public const string Cancelled = "CANCELLED";
}

public static class PaymentStatus
{
    public const string Pending = "PENDING";
    public const string Processing = "PROCESSING";
    public const string Completed = "COMPLETED";
    public const string Failed = "FAILED";
    public const string Cancelled = "CANCELLED";
    public const string Expired = "EXPIRED";
}

public static class PaymentType
{
    public const string Deposit = "DEPOSIT";
    public const string Monthly = "MONTHLY";
    public const string Penalty = "PENALTY";
    public const string Damage = "DAMAGE";
}

public static class WarehouseReturnStatus
{
    public const string Pending = "PENDING";
    public const string Initiated = "INITIATED";
    public const string Inspected = "INSPECTED";
    public const string PendingApproval = "PENDING_APPROVAL";
    public const string Approved = "APPROVED";
    public const string Rejected = "REJECTED";
    public const string Completed = "COMPLETED";
}

public static class ContractExtensionStatus
{
    public const string Pending = "PENDING";
    public const string Approved = "APPROVED";
    public const string Rejected = "REJECTED";
    public const string Cancelled = "CANCELLED";
}
