namespace WMS.Application.Features.Contracts.CompleteContract
{
    public class CompleteContractResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int ContractId { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? CompletedAt { get; set; }
    }
}