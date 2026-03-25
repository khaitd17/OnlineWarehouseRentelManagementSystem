using WMS.Domain.Enums;

namespace WMS.Domain.Entities;

public class WarehouseReturn
{
    private WarehouseReturn() { } // For EF Core

    public int ReturnId { get; private set; }
    public int ContractId { get; private set; }
    public int? InspectorId { get; private set; }
    public DateTime? InspectionDate { get; private set; }
    public string Status { get; private set; } = WarehouseReturnStatus.Pending;

    // Checklist
    public bool IsClean { get; private set; }
    public bool IsEquipmentIntact { get; private set; }
    public bool IsNoOutstandingDebt { get; private set; }

    // Notes and fees
    public string? Notes { get; private set; }
    public string? RejectionReason { get; private set; }
    public decimal? DamageFee { get; private set; }
    public decimal? PenaltyFee { get; private set; }

    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    // Navigation properties
    public RentalContract? Contract { get; set; }
    public User? Inspector { get; set; }
    public ICollection<ReturnImage> Images { get; set; } = new List<ReturnImage>();

    // Factory method
    public static WarehouseReturn Create(int contractId)
    {
        return new WarehouseReturn
        {
            ContractId = contractId,
            Status = WarehouseReturnStatus.Initiated,
            CreatedAt = DateTime.UtcNow
        };
    }

    // Alternative factory method for contract-based creation
    public static WarehouseReturn CreateForContract(
        int contractId,
        bool? isClean = null,
        bool? isEquipmentIntact = null,
        bool? isNoOutstandingDebt = null,
        string? notes = null)
    {
        var warehouseReturn = new WarehouseReturn
        {
            ContractId = contractId,
            Status = WarehouseReturnStatus.Initiated,
            CreatedAt = DateTime.UtcNow,
            Notes = notes
        };

        if (isClean.HasValue)
            warehouseReturn.IsClean = isClean.Value;
        if (isEquipmentIntact.HasValue)
            warehouseReturn.IsEquipmentIntact = isEquipmentIntact.Value;
        if (isNoOutstandingDebt.HasValue)
            warehouseReturn.IsNoOutstandingDebt = isNoOutstandingDebt.Value;

        return warehouseReturn;
    }

    // Record inspection results
    public void RecordInspection(
        int inspectorId,
        bool isClean,
        bool isEquipmentIntact,
        bool isNoOutstandingDebt,
        string? notes = null,
        decimal? damageFee = null,
        decimal? penaltyFee = null)
    {
        InspectorId = inspectorId;
        InspectionDate = DateTime.UtcNow;
        IsClean = isClean;
        IsEquipmentIntact = isEquipmentIntact;
        IsNoOutstandingDebt = isNoOutstandingDebt;
        Notes = notes;
        DamageFee = damageFee;
        PenaltyFee = penaltyFee;
        Status = WarehouseReturnStatus.PendingApproval;
        UpdatedAt = DateTime.UtcNow;
    }

    // Submit inspection (alias for RecordInspection or for changing status)
    public void SubmitInspection()
    {
        if (Status != WarehouseReturnStatus.Initiated && Status != WarehouseReturnStatus.PendingApproval)
            throw new InvalidOperationException($"Cannot submit inspection for return with status {Status}");

        Status = WarehouseReturnStatus.Inspected;
        UpdatedAt = DateTime.UtcNow;
    }

    // Submit inspection with parameters (calls RecordInspection)
    public void SubmitInspection(
        int inspectorId,
        bool isClean,
        bool isEquipmentIntact,
        bool isNoOutstandingDebt,
        string? notes = null,
        decimal? damageFee = null,
        decimal? penaltyFee = null)
    {
        RecordInspection(
            inspectorId,
            isClean,
            isEquipmentIntact,
            isNoOutstandingDebt,
            notes,
            damageFee,
            penaltyFee);

        // Change to inspected status after recording
        Status = WarehouseReturnStatus.Inspected;
        UpdatedAt = DateTime.UtcNow;
    }

    // Approve return
    public void Approve()
    {
        if (Status != WarehouseReturnStatus.PendingApproval && Status != WarehouseReturnStatus.Inspected)
            throw new InvalidOperationException($"Cannot approve return with status {Status}");

        Status = WarehouseReturnStatus.Approved;
        UpdatedAt = DateTime.UtcNow;
    }

    // Reject return
    public void Reject(string reason)
    {
        if (Status != WarehouseReturnStatus.PendingApproval && Status != WarehouseReturnStatus.Inspected)
            throw new InvalidOperationException($"Cannot reject return with status {Status}");

        Status = WarehouseReturnStatus.Rejected;
        RejectionReason = reason;
        UpdatedAt = DateTime.UtcNow;
    }

    // Complete return
    public void Complete()
    {
        if (Status != WarehouseReturnStatus.Approved)
            throw new InvalidOperationException($"Cannot complete return with status {Status}");

        Status = WarehouseReturnStatus.Completed;
        UpdatedAt = DateTime.UtcNow;
    }

    // Add image
    public void AddImage(string imageUrl, string? description = null)
    {
        Images.Add(new ReturnImage
        {
            ReturnId = ReturnId,
            ImageUrl = imageUrl,
            Description = description,
            CreatedAt = DateTime.UtcNow
        });
        UpdatedAt = DateTime.UtcNow;
    }

    // Calculate total fee
    public decimal TotalFee => (DamageFee ?? 0) + (PenaltyFee ?? 0);

    // Check if has issues
    public bool HasIssues => !IsClean || !IsEquipmentIntact || !IsNoOutstandingDebt || TotalFee > 0;
}

public class ReturnImage
{
    public int ImageId { get; set; }
    public int ReturnId { get; set; }
    public string ImageUrl { get; set; } = null!;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation
    public WarehouseReturn? Return { get; set; }
}
