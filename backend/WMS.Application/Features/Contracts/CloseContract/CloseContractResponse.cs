namespace WMS.Application.Features.Contracts.CloseContract
{
    public class CloseContractResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int ContractId { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? ClosedAt { get; set; }
        public decimal? DamageCompensation { get; set; }
    }
}