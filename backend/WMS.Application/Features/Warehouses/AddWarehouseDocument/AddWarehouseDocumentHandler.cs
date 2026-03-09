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

        await _documentRepository.AddAsync(
            request.WarehouseId,
            request.DocumentType,
            request.DocumentUrl,
            cancellationToken);
    }
}