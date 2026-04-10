using WMS.Domain.Enums;

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
    
    // NEW - Cancel tracking
    public DateTime? CancelledAt { get; private set; }
    public string? CancelledBy { get; private set; } // USER, OWNER, SYSTEM
    public int GracePeriodHours { get; private set; } = 24; // Default 24h
    public decimal? CancellationFee { get; private set; }

    // Expiry tracking for background jobs
    public DateTime? OwnerSignatureExpiry { get; private set; }
    public DateTime? RenterSignatureExpiry { get; private set; }
    public DateTime? PaymentExpiry { get; private set; }

    // Termination/Close approval tracking (2-party approval)
    public string? TerminationRequestedBy { get; private set; } // "RENTER" or "OWNER"
    public DateTime? TerminationRequestedAt { get; private set; }
    public bool RenterApprovedTermination { get; private set; }
    public bool OwnerApprovedTermination { get; private set; }
    public decimal? EarlyTerminationFee { get; private set; }

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
            CreatedAt = DateTime.UtcNow,
            OwnerSignatureExpiry = DateTime.UtcNow.AddHours(48) // 48h timeout for owner to sign
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
        Status = "PENDING_RENTER_SIGNATURE"; // Chờ xác thực ký của người thuê
        RenterSignatureExpiry = DateTime.UtcNow.AddHours(48); // 48h timeout for renter to sign
        OwnerSignatureExpiry = null; // Clear owner expiry
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkPendingSignature()
    {
        if (Status != "PENDING_RENTER_SIGNATURE" && Status != "PENDING_RENTER_SIGNATURE")
            throw new InvalidOperationException($"Cannot mark pending signature for contract with status {Status}");

        Status = "PENDING_RENTER_SIGNATURE";
        UpdatedAt = DateTime.UtcNow;
    }

    public void Sign(string signedFileUrl)
    {
        if (Status != "PENDING_RENTER_SIGNATURE")
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

    // Request termination - needs approval from other party
    public void RequestTerminationEarly(string requestedBy, string reason, decimal? fee = null)
    {
        if (Status != "ACTIVE")
            throw new InvalidOperationException($"Cannot request termination for contract with status {Status}");
        
        if (requestedBy != "RENTER" && requestedBy != "OWNER")
            throw new ArgumentException("RequestedBy must be RENTER or OWNER");

        Status = "PENDING_TERMINATION";
        TerminationRequestedBy = requestedBy;
        TerminationRequestedAt = DateTime.UtcNow;
        TerminationReason = reason;
        EarlyTerminationFee = fee;
        
        // Auto-approve for requester
        if (requestedBy == "RENTER")
            RenterApprovedTermination = true;
        else
            OwnerApprovedTermination = true;
        
        UpdatedAt = DateTime.UtcNow;
    }

    // Approve termination request
    public void ApproveTermination(string approvedBy)
    {
        if (Status != "PENDING_TERMINATION")
            throw new InvalidOperationException($"Cannot approve termination for contract with status {Status}");
        
        if (approvedBy == "RENTER")
            RenterApprovedTermination = true;
        else if (approvedBy == "OWNER")
            OwnerApprovedTermination = true;
        else
            throw new ArgumentException("ApprovedBy must be RENTER or OWNER");

        // If both parties approved, terminate
        if (RenterApprovedTermination && OwnerApprovedTermination)
        {
            Status = "TERMINATED";
            TerminatedAt = DateTime.UtcNow;
        }
        
        UpdatedAt = DateTime.UtcNow;
    }

    // Reject termination request
    public void RejectTermination(string rejectedBy)
    {
        if (Status != "PENDING_TERMINATION")
            throw new InvalidOperationException($"Cannot reject termination for contract with status {Status}");
        
        // Reset to ACTIVE
        Status = "ACTIVE";
        TerminationRequestedBy = null;
        TerminationRequestedAt = null;
        RenterApprovedTermination = false;
        OwnerApprovedTermination = false;
        TerminationReason = null;
        EarlyTerminationFee = null;
        
        UpdatedAt = DateTime.UtcNow;
    }

    public void TerminateEarly(string reason, decimal? earlyTerminationFee = null)
    {
        if (Status != "ACTIVE")
            throw new InvalidOperationException($"Cannot terminate contract early with status {Status}");

        Status = "TERMINATED";
        TerminationReason = reason;
        EarlyTerminationFee = earlyTerminationFee;
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
    
    // NEW - Cancel with detailed tracking
    public void CancelWithReason(string reason, string cancelledBy = "USER")
    {
        if (Status == "TERMINATED" || Status == "COMPLETED" || Status == "EXPIRED")
            throw new InvalidOperationException($"Cannot cancel contract with status {Status}");

        Status = cancelledBy switch
        {
            "USER" => RentalContractStatus.CancelledByUser,
            "OWNER" => RentalContractStatus.CancelledByOwner,
            "SYSTEM" => RentalContractStatus.CancelledNoPayment,
            _ => RentalContractStatus.Cancelled
        };
        
        CancellationReason = reason;
        CancelledAt = DateTime.UtcNow;
        CancelledBy = cancelledBy;
        UpdatedAt = DateTime.UtcNow;
    }

    // Request close - needs approval from other party  
    public void RequestClose(string requestedBy)
    {
        if (Status != "ACTIVE")
            throw new InvalidOperationException($"Cannot request close for contract with status {Status}");
        
        if (requestedBy != "RENTER" && requestedBy != "OWNER")
            throw new ArgumentException("RequestedBy must be RENTER or OWNER");

        Status = "PENDING_CLOSE";
        TerminationRequestedBy = requestedBy;
        TerminationRequestedAt = DateTime.UtcNow;
        
        // Auto-approve for requester
        if (requestedBy == "RENTER")
            RenterApprovedTermination = true;
        else
            OwnerApprovedTermination = true;
        
        UpdatedAt = DateTime.UtcNow;
    }

    // Approve close request
    public void ApproveClose(string approvedBy)
    {
        if (Status != "PENDING_CLOSE")
            throw new InvalidOperationException($"Cannot approve close for contract with status {Status}");
        
        if (approvedBy == "RENTER")
            RenterApprovedTermination = true;
        else if (approvedBy == "OWNER")
            OwnerApprovedTermination = true;
        else
            throw new ArgumentException("ApprovedBy must be RENTER or OWNER");

        // If both parties approved, close
        if (RenterApprovedTermination && OwnerApprovedTermination)
        {
            Status = "CLOSED";
            ReturnedAt = DateTime.UtcNow;
        }
        
        UpdatedAt = DateTime.UtcNow;
    }

    // Reject close request
    public void RejectClose(string rejectedBy)
    {
        if (Status != "PENDING_CLOSE")
            throw new InvalidOperationException($"Cannot reject close for contract with status {Status}");
        
        // Reset to ACTIVE
        Status = "ACTIVE";
        TerminationRequestedBy = null;
        TerminationRequestedAt = null;
        RenterApprovedTermination = false;
        OwnerApprovedTermination = false;
        
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

    public void MarkPendingPayment(double expiryHours = 48)
    {
        if (Status != "PENDING_RENTER_SIGNATURE" && Status != "ACTIVE")
            throw new InvalidOperationException($"Cannot mark pending payment for contract with status {Status}");

        Status = "PENDING_PAYMENT";
        PaymentExpiry = DateTime.UtcNow.AddHours(expiryHours); // 48h timeout for payment
        RenterSignatureExpiry = null; // Clear renter signature expiry
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
    public bool IsPendingSignature => Status == "PENDING_RENTER_SIGNATURE";
    public bool IsPendingPayment => Status == "PENDING_PAYMENT";
    public bool IsActive => Status == "ACTIVE";
    public bool IsExpired => Status == "EXPIRED";
    public bool IsTerminated => Status == "TERMINATED";
    public bool IsOverdue => Status == "OVERDUE";

    // Expiry checking properties for background jobs (use new explicit fields)
    public DateTime? PendingSignatureExpiry => RenterSignatureExpiry;
    public DateTime? PendingPaymentExpiry => PaymentExpiry;

    // Additional methods
    public void ActivateAfterPayment()
    {
        if (Status != "PENDING_PAYMENT")
            throw new InvalidOperationException($"Cannot activate contract with status {Status}");

        Status = "ACTIVE";
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Force activate the contract regardless of current status.
    /// Used when owner confirms cash payment.
    /// </summary>
    public void ForceActivate()
    {
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
