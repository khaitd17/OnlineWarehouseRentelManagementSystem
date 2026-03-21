namespace WMS.Application.Features.Contracts.GetContractHistory
{
    public class GetContractHistoryResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public ContractHistoryDto? Contract { get; set; }
        public List<ContractLogDto> Logs { get; set; } = new();
        public List<ContractExtensionDto> Extensions { get; set; } = new();
        public List<PaymentDto> Payments { get; set; } = new();
        public WarehouseReturnDto? Return { get; set; }
    }

    public class ContractHistoryDto
    {
        public int ContractId { get; set; }
        public string ContractNumber { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal MonthlyPayment { get; set; }
        public decimal TotalValue { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? SignedAt { get; set; }
        public DateTime? ReturnedAt { get; set; }
        public string? CancellationReason { get; set; }
        public int? ParentContractId { get; set; }
    }

    public class ContractLogDto
    {
        public int LogId { get; set; }
        public string Action { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public string UserName { get; set; } = string.Empty;
    }

    public class ContractExtensionDto
    {
        public int ExtensionId { get; set; }
        public string Status { get; set; } = string.Empty;
        public int DurationMonths { get; set; }
        public decimal? ProposedMonthlyPayment { get; set; }
        public DateTime RequestedAt { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public string? RejectionReason { get; set; }
        public int? NewContractId { get; set; }
    }

    public class PaymentDto
    {
        public int PaymentId { get; set; }
        public string PaymentType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string PaymentCode { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? PaidAt { get; set; }
    }

    public class WarehouseReturnDto
    {
        public int ReturnId { get; set; }
        public string Status { get; set; } = string.Empty;
        public bool IsClean { get; set; }
        public bool IsEquipmentIntact { get; set; }
        public bool IsNoOutstandingDebt { get; set; }
        public decimal? DamageFee { get; set; }
        public decimal? PenaltyFee { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? InspectionDate { get; set; }
    }
}