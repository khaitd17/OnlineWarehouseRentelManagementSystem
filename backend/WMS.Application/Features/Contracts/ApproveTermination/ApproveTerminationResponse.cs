namespace WMS.Application.Features.Contracts.ApproveTermination
{
    public class ApproveTerminationResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int ContractId { get; set; }
        public string Status { get; set; } = string.Empty;
        public bool IsFullyApproved { get; set; }
    }
}
