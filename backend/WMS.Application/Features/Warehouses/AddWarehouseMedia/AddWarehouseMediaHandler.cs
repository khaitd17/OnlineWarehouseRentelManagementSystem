using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Warehouses.AddWarehouseMedia;

public class AddWarehouseMediaHandler : IRequestHandler<AddWarehouseMediaCommand>
{
    private readonly IWarehouseRepository _warehouseRepository;
    private readonly IWarehouseMediaRepository _mediaRepository;

    public AddWarehouseMediaHandler(
        IWarehouseRepository warehouseRepository,
        IWarehouseMediaRepository mediaRepository)
    {
        _warehouseRepository = warehouseRepository;
        _mediaRepository = mediaRepository;
    }

    public async Task Handle(
        AddWarehouseMediaCommand request,
        CancellationToken cancellationToken)
    {
        var exists = await _warehouseRepository
            .ExistsAsync(request.WarehouseId, cancellationToken);

        if (!exists)
            throw new Exception("Warehouse not found");

        var folder = Path.Combine("uploads", "warehouses");

        if (!Directory.Exists(folder))
            Directory.CreateDirectory(folder);

        var fileName = Guid.NewGuid() + Path.GetExtension(request.File.FileName);

        var path = Path.Combine(folder, fileName);

        using (var stream = new FileStream(path, FileMode.Create))
        {
            await request.File.CopyToAsync(stream);
        }

        var url = $"/uploads/warehouses/{fileName}";

        await _mediaRepository.AddAsync(
            request.WarehouseId,
            url,
            request.MediaType,
            request.IsPrimary,
            cancellationToken);
    }
}