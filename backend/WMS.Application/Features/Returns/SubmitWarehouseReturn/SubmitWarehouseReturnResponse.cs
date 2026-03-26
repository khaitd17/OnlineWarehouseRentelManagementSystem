namespace WMS.Application.Features.Returns.SubmitWarehouseReturn
{
    public class SubmitWarehouseReturnResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int? ReturnId { get; set; }
        public string Status { get; set; } = string.Empty;
        public bool RequiresInspection { get; set; }
        public string NextSteps { get; set; } = string.Empty;
    }
}