namespace WMS.Application.Features.ContractExtensions.RequestExtension
{
    public class RequestExtensionResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int? ExtensionId { get; set; }
        public string Status { get; set; } = string.Empty;
        public string NextSteps { get; set; } = string.Empty;
    }
}