using MediatR;

public class AddWarehouseDocumentCommand : IRequest
{
    public int WarehouseId { get; set; }

    public string DocumentType { get; set; } = null!;

    public string DocumentUrl { get; set; } = null!;
}