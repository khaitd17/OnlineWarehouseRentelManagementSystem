namespace WMS.Domain.Enums;

public static class RentalRequestStatus
{
    public const string Pending = "PENDING";
    public const string Approved = "APPROVED";
    public const string Rejected = "REJECTED";
    public const string Cancelled = "CANCELLED";
    
    // NEW - Cancel tracking
    public const string CancelledByUser = "CANCELLED_BY_USER";
    public const string CancelledByOwner = "CANCELLED_BY_OWNER";
    public const string CancelledBySystem = "CANCELLED_BY_SYSTEM";
}

public static class RentalContractStatus
{
    // Existing
    public const string Draft = "DRAFT";
    public const string Negotiating = "NEGOTIATING";
    public const string RevisionRequested = "REVISION_REQUESTED";
    public const string ApprovedForSigning = "APPROVED_FOR_SIGNING";
    public const string PendingOwnerSignature = "PENDING_OWNER_SIGNATURE";
    public const string PendingRenterSignature = "PENDING_RENTER_SIGNATURE";
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

    // NEW - 2-party approval for termination/close
    public const string PendingTermination = "PENDING_TERMINATION";
    public const string PendingClose = "PENDING_CLOSE";
    
    // NEW - Cancel tracking
    public const string CancelledByUser = "CANCELLED_BY_USER";
    public const string CancelledByOwner = "CANCELLED_BY_OWNER";
    public const string CancelledNoPayment = "CANCELLED_NO_PAYMENT";
    public const string ExpiredSignature = "EXPIRED_SIGNATURE";
    public const string ExpiredPayment = "EXPIRED_PAYMENT";
}

public static class ContractRevisionStatus
{
    public const string Open = "OPEN";
    public const string Accepted = "ACCEPTED";
    public const string Rejected = "REJECTED";
    public const string Resolved = "RESOLVED";
}

public static class PaymentStatus
{
    public const string Pending = "PENDING";
    public const string Processing = "PROCESSING";
    public const string Completed = "COMPLETED";
    public const string Failed = "FAILED";
    public const string Cancelled = "CANCELLED";
    public const string Expired = "EXPIRED";
    
    // NEW - Cancel tracking
    public const string CancelledByUser = "CANCELLED_BY_USER";
    public const string PendingConfirmation = "PENDING_CONFIRMATION"; // Cash payment
    public const string RetryPending = "RETRY_PENDING";
}

public static class PaymentType
{
    public const string Deposit = "DEPOSIT";
    public const string Monthly = "MONTHLY";
    public const string Penalty = "PENALTY";
    public const string Damage = "DAMAGE";
    public const string Extension = "EXTENSION";
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
    public const string PendingPayment = "PENDING_PAYMENT";
    public const string Completed = "COMPLETED";
    public const string Rejected = "REJECTED";
    public const string Cancelled = "CANCELLED";
}
