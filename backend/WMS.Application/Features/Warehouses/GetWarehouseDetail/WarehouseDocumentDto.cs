namespace WMS.Application.Features.Warehouses.GetWarehouseDetail;

public class WarehouseDocumentDto
{
    public int DocumentId { get; set; }
    public string DocumentType { get; set; } = null!;
    public string DocumentUrl { get; set; } = null!;
    public string? Status { get; set; }
    public DateTime? CreatedAt { get; set; }
}
