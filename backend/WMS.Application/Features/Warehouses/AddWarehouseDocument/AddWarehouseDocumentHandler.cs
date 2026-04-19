using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Warehouses.AddWarehouseMedia;

public class AddWarehouseDocumentHandler : IRequestHandler<AddWarehouseDocumentCommand>
{
    private readonly IWarehouseRepository _warehouseRepository;
    private readonly IWarehouseDocumentRepository _documentRepository;

    public AddWarehouseDocumentHandler(
        IWarehouseRepository warehouseRepository,
        IWarehouseDocumentRepository documentRepository)
    {
        _warehouseRepository = warehouseRepository;
        _documentRepository = documentRepository;
    }

    public async Task Handle(
        AddWarehouseDocumentCommand request,
        CancellationToken cancellationToken)
    {
        var exists = await _warehouseRepository
            .ExistsAsync(request.WarehouseId, cancellationToken);

        if (!exists)
            throw new Exception("Warehouse not found");

        var folder = Path.Combine("uploads", "documents");

        if (!Directory.Exists(folder))
            Directory.CreateDirectory(folder);

        var fileName = Guid.NewGuid() + Path.GetExtension(request.File.FileName);
        var path = Path.Combine(folder, fileName);

        using (var stream = new FileStream(path, FileMode.Create))
        {
            await request.File.CopyToAsync(stream);
        }

        var url = $"/uploads/documents/{fileName}";

        await _documentRepository.AddAsync(
            request.WarehouseId,
            request.DocumentType,
            url,
            cancellationToken);
    }
}