namespace WMS.Application.Interfaces;

public class ContractPdfData
{
    public int ContractId { get; set; }
    public string ContractNumber { get; set; } = null!;
    public string RenterName { get; set; } = null!;
    public string RenterEmail { get; set; } = null!;
    public string OwnerName { get; set; } = null!;
    public string WarehouseName { get; set; } = null!;
    public string WarehouseAddress { get; set; } = null!;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal MonthlyPayment { get; set; }
    public decimal TotalValue { get; set; }
    public decimal? DepositAmount { get; set; }
    public string? Terms { get; set; }
    public string? OwnerSignatureBase64 { get; set; }  // Chữ ký chủ kho
    public string? RenterSignatureBase64 { get; set; } // Chữ ký người thuê
}

public interface IPdfService
{
    Task<string> GenerateContractPdfAsync(ContractPdfData data, string? signatureBase64 = null);
    Task<string> EmbedSignatureInPdfAsync(string pdfRelativeUrl, string signatureBase64);
    Task<string> CreateSignedDocumentFromImageAsync(string imageRelativeUrl, string signatureBase64);
    bool PdfFileExists(string pdfRelativeUrl);
}
