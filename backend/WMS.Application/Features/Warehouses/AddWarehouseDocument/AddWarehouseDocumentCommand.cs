using MediatR;
using Microsoft.AspNetCore.Http;

public class AddWarehouseDocumentCommand : IRequest
{
    public int WarehouseId { get; set; }

    public string DocumentType { get; set; } = null!;

    public IFormFile File { get; set; } = null!;
}