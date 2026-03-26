namespace WMS.Application.Features.Contracts.GetContracts
{
    public class GetContractsResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public List<ContractSummaryDto> Contracts { get; set; } = new();
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
    }

    public class ContractSummaryDto
    {
        public int ContractId { get; set; }
        public string ContractNumber { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string RenterName { get; set; } = string.Empty;
        public string WarehouseName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal MonthlyPayment { get; set; }
        public decimal TotalValue { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? SignedAt { get; set; }
        public int? ParentContractId { get; set; }
    }
}