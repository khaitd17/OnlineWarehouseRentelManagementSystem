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

    // Additional properties for advanced contract management
    public int? ParentContractId { get; private set; }
    public DateTime? ReturnedAt { get; private set; }
    public string? CancellationReason { get; private set; }
    public DateTime? TerminatedAt { get; private set; }
    public string? TerminationReason { get; private set; }

    // Navigation properties
    public RentalRequest? RentalRequest { get; set; }
    public Warehouse? Warehouse { get; set; }
    public User? Renter { get; set; }

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

        SignedFileUrl = signedFileUrl;
        SignedAt = DateTime.UtcNow;
        Status = "ACTIVE";
        UpdatedAt = DateTime.UtcNow;
    }

    public void Terminate(string reason)
    {
        if (Status != "ACTIVE")
            throw new InvalidOperationException($"Cannot terminate contract with status {Status}");

        Status = "TERMINATED";
        TerminationReason = reason;
        TerminatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void TerminateEarly(string reason, decimal? earlyTerminationFee = null)
    {
        if (Status != "ACTIVE")
            throw new InvalidOperationException($"Cannot terminate contract early with status {Status}");

        Status = "TERMINATED";
        TerminationReason = reason;
        TerminatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Cancel(string reason)
    {
        if (Status == "TERMINATED" || Status == "COMPLETED" || Status == "EXPIRED")
            throw new InvalidOperationException($"Cannot cancel contract with status {Status}");

        Status = "CANCELLED";
        CancellationReason = reason;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Close(decimal? damageCompensation = null, string? returnNotes = null)
    {
        if (Status != "ACTIVE")
            throw new InvalidOperationException($"Cannot close contract with status {Status}");

        Status = "CLOSED";
        ReturnedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Complete()
    {
        if (Status != "ACTIVE")
            throw new InvalidOperationException($"Cannot complete contract with status {Status}");

        Status = "COMPLETED";
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkPendingPayment(double expiryHours = 24)
    {
        if (Status != "PENDING_SIGNATURE" && Status != "ACTIVE")
            throw new InvalidOperationException($"Cannot mark pending payment for contract with status {Status}");

        Status = "PENDING_PAYMENT";
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetParentContract(int parentContractId)
    {
        ParentContractId = parentContractId;
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
    public bool IsPendingPayment => Status == "PENDING_PAYMENT";
    public bool IsActive => Status == "ACTIVE";
    public bool IsExpired => Status == "EXPIRED";
    public bool IsTerminated => Status == "TERMINATED";
    public bool IsOverdue => Status == "OVERDUE";

    // Expiry checking properties for background jobs
    public DateTime? PendingSignatureExpiry => IsPendingSignature ? CreatedAt.AddHours(24) : null;
    public DateTime? PendingPaymentExpiry => IsPendingPayment ? CreatedAt.AddHours(48) : null;

    // Additional methods
    public void ActivateAfterPayment()
    {
        if (Status != "PENDING_PAYMENT")
            throw new InvalidOperationException($"Cannot activate contract with status {Status}");

        Status = "ACTIVE";
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkOverdue()
    {
        if (Status != "ACTIVE")
            throw new InvalidOperationException($"Cannot mark overdue for contract with status {Status}");

        Status = "OVERDUE";
        UpdatedAt = DateTime.UtcNow;
    }

    public virtual ICollection<Equipment> IncludedEquipments { get; set; } = new List<Equipment>();
    public virtual ICollection<EquipmentHistory> EquipmentUsageLogs { get; set; } = new List<EquipmentHistory>();
}
