using System;
using System.Collections.Generic;

namespace WMS.Domain.Entities;

public partial class VContractPayment
{
    public int ContractId { get; set; }

    public string? ContractNumber { get; set; }

    public int RenterId { get; set; }

    public string RenterName { get; set; } = null!;

    public int WarehouseId { get; set; }

    public string WarehouseName { get; set; } = null!;

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public string? ContractStatus { get; set; }

    public decimal TotalValue { get; set; }

    public decimal MonthlyPayment { get; set; }

    public int? TotalPayments { get; set; }

    public decimal? PaidAmount { get; set; }

    public decimal? PendingAmount { get; set; }

    public decimal? OverdueAmount { get; set; }
}
