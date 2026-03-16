namespace WMS.Application.Features.RentalContracts.Common;

public class RentalContractDto
{
    public int ContractId { get; set; }
    public int RentalRequestId { get; set; }
    public string ContractNumber { get; set; } = null!;
    public int RenterId { get; set; }
    public string RenterName { get; set; } = null!;
    public string RenterEmail { get; set; } = null!;
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = null!;
    public string WarehouseAddress { get; set; } = null!;
public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal MonthlyPayment { get; set; }
    public decimal TotalValue { get; set; }
    public decimal? DepositAmount { get; set; }
    public string Status { get; set; } = null!;
    public string? Terms { get; set; }
    public DateTime CreatedAt { get; set; }
}
