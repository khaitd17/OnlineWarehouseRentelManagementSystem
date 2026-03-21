namespace WMS.Domain.Entities;

public class RentalContract
{
    private RentalContract() { } // For EF Core

    public int ContractId { get; private set; }
    public int RentalRequestId { get; private set; }
    public string ContractNumber { get; private set; } = null!;
    public int RenterId { get; private set; }
    public int WarehouseId { get; private set; }
    public DateTime StartDate { get; private set; }
    public DateTime EndDate { get; private set; }
    public decimal MonthlyPayment { get; private set; }
    public decimal TotalValue { get; private set; }
    public decimal? DepositAmount { get; private set; }
    public string Status { get; private set; } = "PENDING_OWNER_SIGNATURE";
    public string? Terms { get; private set; }
    public string? ContractFileUrl { get; private set; }
    public string? SignedFileUrl { get; private set; }
    public DateTime? SignedAt { get; private set; }
    public string? OwnerSignedFileUrl { get; private set; }
    public DateTime? OwnerSignedAt { get; private set; }
    public string? OwnerSignatureBase64 { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    // NEW: Cancellation fields
    public string? CancellationReason { get; private set; }
    public DateTime? CancelledAt { get; private set; }

    // NEW: OTP signing lock
    public int OtpAttempts { get; private set; }
    public bool IsSigningLocked { get; private set; }
    public DateTime? SigningLockedUntil { get; private set; }

    // NEW: Expiry tracking
    public DateTime? PendingSignatureExpiry { get; private set; }
    public DateTime? PendingPaymentExpiry { get; private set; }

    // NEW: Contract extension
    public int? ParentContractId { get; private set; }

    // NEW: Termination fees
    public decimal? EarlyTerminationFee { get; private set; }
    public decimal? DamageCompensation { get; private set; }

    // NEW: Return tracking
    public DateTime? ReturnedAt { get; private set; }
    public string? ReturnNotes { get; private set; }

    // Navigation properties
    public RentalRequest? RentalRequest { get; set; }
    public Warehouse? Warehouse { get; set; }
    public RentalContract? ParentContract { get; set; }
    public ICollection<RentalPayment> Payments { get; set; } = new List<RentalPayment>();
    public ICollection<WarehouseReturn> Returns { get; set; } = new List<WarehouseReturn>();

    // Factory method
    public static RentalContract CreateFromRequest(
        RentalRequest request,
        decimal monthlyPayment,
        decimal? depositAmount = null,
        string? terms = null,
        DateTime? startDateOverride = null,
        int? durationMonthsOverride = null)
    {
        if (request.Status != "APPROVED")
            throw new InvalidOperationException("Can only create contract from approved request");

        var effectiveStartDate = startDateOverride ?? request.StartDate;
        var effectiveDuration = durationMonthsOverride ?? request.DurationMonths;
        var endDate = effectiveStartDate.AddMonths(effectiveDuration);
        var totalValue = monthlyPayment * effectiveDuration;

        var contractNumber = GenerateContractNumber();

        return new RentalContract
        {
            RentalRequestId = request.RequestId,
            ContractNumber = contractNumber,
            RenterId = request.RenterId,
            WarehouseId = request.WarehouseId,
            StartDate = effectiveStartDate,
            EndDate = endDate,
            MonthlyPayment = monthlyPayment,
            TotalValue = totalValue,
            DepositAmount = depositAmount,
            Status = "PENDING_OWNER_SIGNATURE",
            Terms = terms,
            CreatedAt = DateTime.UtcNow
        };
    }

    // Domain methods
    public void SetContractFileUrl(string url)
    {
        ContractFileUrl = url;
    }

    public void OwnerSign(string ownerSignedFileUrl, string ownerSignatureBase64)
    {
        if (Status != "PENDING_OWNER_SIGNATURE")
            throw new InvalidOperationException($"Cannot owner-sign contract with status {Status}");

        OwnerSignedFileUrl = ownerSignedFileUrl;
        OwnerSignedAt = DateTime.UtcNow;
        OwnerSignatureBase64 = ownerSignatureBase64;
        Status = "PENDING_SIGNATURE"; // Chờ xác thực ký của người thuê
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkPendingSignature()
    {
        if (Status != "PENDING_RENTER_SIGNATURE" && Status != "PENDING_SIGNATURE")
            throw new InvalidOperationException($"Cannot mark pending signature for contract with status {Status}");

        Status = "PENDING_SIGNATURE";
        UpdatedAt = DateTime.UtcNow;
    }

    public void Sign(string signedFileUrl)
    {
        if (Status != "PENDING_SIGNATURE")
            throw new InvalidOperationException($"Cannot sign contract with status {Status}");

        if (IsSigningLocked && SigningLockedUntil > DateTime.UtcNow)
            throw new InvalidOperationException("Signing is locked due to too many failed OTP attempts");

        SignedFileUrl = signedFileUrl;
        SignedAt = DateTime.UtcNow;
        Status = "SIGNED";
        UpdatedAt = DateTime.UtcNow;
    }

    // NEW: Mark contract as pending payment after signing
    public void MarkPendingPayment(int expiryHours = 48)
    {
        if (Status != "SIGNED")
            throw new InvalidOperationException($"Cannot mark pending payment for contract with status {Status}");

        Status = "PENDING_PAYMENT";
        PendingPaymentExpiry = DateTime.UtcNow.AddHours(expiryHours);
        UpdatedAt = DateTime.UtcNow;
    }

    // NEW: Activate contract after payment
    public void ActivateAfterPayment()
    {
        if (Status != "PENDING_PAYMENT")
            throw new InvalidOperationException($"Cannot activate contract with status {Status}");

        Status = "ACTIVE";
        PendingPaymentExpiry = null;
        UpdatedAt = DateTime.UtcNow;
    }

    // NEW: Complete contract when end date reached
    public void Complete()
    {
        if (Status != "ACTIVE")
            throw new InvalidOperationException($"Cannot complete contract with status {Status}");

        Status = "COMPLETED";
        UpdatedAt = DateTime.UtcNow;
    }

    // NEW: Close contract after warehouse return
    public void Close(decimal? damageCompensation = null, string? returnNotes = null)
    {
        if (Status != "COMPLETED" && Status != "OVERDUE")
            throw new InvalidOperationException($"Cannot close contract with status {Status}");

        Status = "CLOSED";
        ReturnedAt = DateTime.UtcNow;
        ReturnNotes = returnNotes;
        DamageCompensation = damageCompensation;
        UpdatedAt = DateTime.UtcNow;
    }

    // NEW: Mark contract as overdue
    public void MarkOverdue()
    {
        if (Status != "COMPLETED")
            throw new InvalidOperationException($"Cannot mark overdue for contract with status {Status}");

        Status = "OVERDUE";
        UpdatedAt = DateTime.UtcNow;
    }

    // NEW: Cancel contract with reason
    public void Cancel(string reason)
    {
        var cancellableStatuses = new[] { "PENDING_OWNER_SIGNATURE", "PENDING_SIGNATURE", "SIGNED", "PENDING_PAYMENT" };
        if (!cancellableStatuses.Contains(Status))
            throw new InvalidOperationException($"Cannot cancel contract with status {Status}");

        Status = "CANCELLED";
        CancellationReason = reason;
        CancelledAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    // NEW: Set pending signature expiry
    public void SetPendingSignatureExpiry(int expiryHours = 48)
    {
        PendingSignatureExpiry = DateTime.UtcNow.AddHours(expiryHours);
        UpdatedAt = DateTime.UtcNow;
    }

    // NEW: OTP attempt tracking
    public void IncrementOtpAttempts()
    {
        OtpAttempts++;
        UpdatedAt = DateTime.UtcNow;

        if (OtpAttempts >= 5)
        {
            LockSigning(24); // Lock for 24 hours
        }
    }

    public void ResetOtpAttempts()
    {
        OtpAttempts = 0;
        UpdatedAt = DateTime.UtcNow;
    }

    // NEW: Lock signing
    public void LockSigning(int lockHours = 24)
    {
        IsSigningLocked = true;
        SigningLockedUntil = DateTime.UtcNow.AddHours(lockHours);
        UpdatedAt = DateTime.UtcNow;
    }

    public void UnlockSigning()
    {
        IsSigningLocked = false;
        SigningLockedUntil = null;
        OtpAttempts = 0;
        UpdatedAt = DateTime.UtcNow;
    }

    // NEW: Set damage compensation
    public void SetDamageCompensation(decimal amount)
    {
        DamageCompensation = amount;
        UpdatedAt = DateTime.UtcNow;
    }

    // NEW: Set early termination fee
    public void SetEarlyTerminationFee(decimal amount)
    {
        EarlyTerminationFee = amount;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Terminate(string reason)
    {
        if (Status != "ACTIVE")
            throw new InvalidOperationException($"Cannot terminate contract with status {Status}");

        Status = "TERMINATED";
        UpdatedAt = DateTime.UtcNow;
    }

    // NEW: Terminate early with fee
    public void TerminateEarly(string reason, decimal fee)
    {
        if (Status != "ACTIVE")
            throw new InvalidOperationException($"Cannot terminate early contract with status {Status}");

        Status = "TERMINATED";
        EarlyTerminationFee = fee;
        CancellationReason = reason;
        CancelledAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Expire()
    {
        if (Status != "ACTIVE")
            throw new InvalidOperationException($"Cannot expire contract with status {Status}");

        Status = "EXPIRED";
        UpdatedAt = DateTime.UtcNow;
    }

    private static string GenerateContractNumber()
    {
        var year = DateTime.UtcNow.Year;
        var timestamp = DateTime.UtcNow.Ticks;
        return $"RTC-{year}-{timestamp % 100000:D5}";
    }

    public bool IsPendingOwnerSignature => Status == "PENDING_OWNER_SIGNATURE";
    public bool IsPendingRenterSignature => Status == "PENDING_RENTER_SIGNATURE";
    public bool IsPendingSignature => Status == "PENDING_SIGNATURE";
    public bool IsSigned => Status == "SIGNED";
    public bool IsPendingPayment => Status == "PENDING_PAYMENT";
    public bool IsActive => Status == "ACTIVE";
    public bool IsCompleted => Status == "COMPLETED";
    public bool IsClosed => Status == "CLOSED";
    public bool IsOverdue => Status == "OVERDUE";
    public bool IsCancelled => Status == "CANCELLED";
    public bool IsExpired => Status == "EXPIRED";
    public bool IsTerminated => Status == "TERMINATED";

    // NEW: Check if contract can be cancelled
    public bool CanBeCancelled => Status is "PENDING_OWNER_SIGNATURE" or "PENDING_SIGNATURE" or "SIGNED" or "PENDING_PAYMENT";

    // NEW: Check if contract is expired for signing
    public bool IsSigningExpired => PendingSignatureExpiry.HasValue && DateTime.UtcNow > PendingSignatureExpiry.Value;

    // NEW: Check if payment is expired
    public bool IsPaymentExpired => PendingPaymentExpiry.HasValue && DateTime.UtcNow > PendingPaymentExpiry.Value;
    // NEW: Set parent contract for extension
    public void SetParentContract(int parentContractId)
    {
        ParentContractId = parentContractId;
        UpdatedAt = DateTime.UtcNow;
    }
}


