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
    public string Status { get; private set; } = "DRAFT";
    public string? Terms { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    // Navigation properties
    public RentalRequest? RentalRequest { get; set; }
    public Warehouse? Warehouse { get; set; }

    // Factory method
    public static RentalContract CreateFromRequest(
        RentalRequest request,
        decimal monthlyPayment,
        decimal? depositAmount = null,
        string? terms = null)
    {
        if (!request.IsApproved)
            throw new InvalidOperationException("Can only create contract from approved request");

        var endDate = request.StartDate.AddMonths(request.DurationMonths);
        var totalValue = monthlyPayment * request.DurationMonths;

        var contractNumber = GenerateContractNumber();

        return new RentalContract
        {
            RentalRequestId = request.RequestId,
            ContractNumber = contractNumber,
            RenterId = request.RenterId,
            WarehouseId = request.WarehouseId,
            StartDate = request.StartDate,
            EndDate = endDate,
            MonthlyPayment = monthlyPayment,
            TotalValue = totalValue,
            DepositAmount = depositAmount,
            Status = "DRAFT",
            Terms = terms,
            CreatedAt = DateTime.UtcNow
        };
    }

    // Domain methods
    public void Activate()
    {
        if (Status != "DRAFT")
            throw new InvalidOperationException($"Cannot activate contract with status {Status}");

        Status = "ACTIVE";
        UpdatedAt = DateTime.UtcNow;
    }

    public void Terminate(string reason)
    {
        if (Status != "ACTIVE")
            throw new InvalidOperationException($"Cannot terminate contract with status {Status}");

        Status = "TERMINATED";
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

    public bool IsDraft => Status == "DRAFT";
    public bool IsActive => Status == "ACTIVE";
    public bool IsExpired => Status == "EXPIRED";
    public bool IsTerminated => Status == "TERMINATED";
}
