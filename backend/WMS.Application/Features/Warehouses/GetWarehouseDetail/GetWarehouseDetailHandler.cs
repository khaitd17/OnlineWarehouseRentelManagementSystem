using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Warehouses.GetWarehouseDetail;

public class GetWarehouseDetailHandler
    : IRequestHandler<GetWarehouseDetailQuery, WarehouseDetailDto?>
{
    private readonly IWarehouseRepository _repository;

    public GetWarehouseDetailHandler(IWarehouseRepository repository)
    {
        _repository = repository;
    }

    public async Task<WarehouseDetailDto?> Handle(
        GetWarehouseDetailQuery request,
        CancellationToken cancellationToken)
    {
        var warehouse = await _repository.GetByIdAsync(request.WarehouseId, cancellationToken);

        if (warehouse == null)
            return null;

        return new WarehouseDetailDto
        {
            WarehouseId = warehouse.WarehouseId,
            OwnerId = warehouse.OwnerId,
            Name = warehouse.Name,
            Address = warehouse.Address,
            Lat = warehouse.Lat,
            Lng = warehouse.Lng,
            Description = warehouse.Description,
            TotalArea = warehouse.TotalArea,
            AvailableArea = warehouse.AvailableArea,
            OperatingHours = warehouse.OperatingHours,
            Status = warehouse.Status,
            CreatedAt = warehouse.CreatedAt,

                Images = warehouse.Images.Select(x => new WarehouseImageDto
                {
                    ImageId = x.ImageId,
                    Url = x.Url
                }).ToList()
        };
    }
}