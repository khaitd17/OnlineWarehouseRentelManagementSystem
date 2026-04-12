namespace WMS.Application.Features.Contracts.TerminateEarly
{
    public class TerminateEarlyResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int ContractId { get; set; }
        public string Status { get; set; } = string.Empty;
        public bool PendingApproval { get; set; }
    }
}