namespace WMS.Application.Features.Returns.UpdateInspection
{
    public class UpdateInspectionResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int ReturnId { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal? TotalFees { get; set; }
        public bool ContractClosed { get; set; }
    }
}