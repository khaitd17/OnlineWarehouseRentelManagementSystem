namespace WMS.Application.Features.Contracts.RequestClose
{
    public class RequestCloseResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int ContractId { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}
