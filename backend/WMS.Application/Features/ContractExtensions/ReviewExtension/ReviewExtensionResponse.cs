namespace WMS.Application.Features.ContractExtensions.ReviewExtension
{
    public class ReviewExtensionResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int ExtensionId { get; set; }
        public string Status { get; set; } = string.Empty;
        public int? NewContractId { get; set; }
        public string NextSteps { get; set; } = string.Empty;
    }
}