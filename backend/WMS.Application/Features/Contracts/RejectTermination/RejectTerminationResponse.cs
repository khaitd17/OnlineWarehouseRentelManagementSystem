namespace WMS.Application.Features.Contracts.RejectTermination
{
    public class RejectTerminationResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int ContractId { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}
