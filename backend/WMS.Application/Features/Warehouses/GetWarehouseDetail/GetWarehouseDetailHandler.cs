using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Warehouses.GetWarehouseDetail;

public class GetWarehouseDetailHandler
    : IRequestHandler<GetWarehouseDetailQuery, WarehouseDetailDto?>
{
    private readonly IWarehouseRepository _repository;
    private readonly IUserRepository _userRepository;

    public GetWarehouseDetailHandler(IWarehouseRepository repository, IUserRepository userRepository)
    {
        _repository = repository;
        _userRepository = userRepository;
    }

    public async Task<WarehouseDetailDto?> Handle(
        GetWarehouseDetailQuery request,
        CancellationToken cancellationToken)
    {
        var warehouse = await _repository.GetByIdAsync(request.WarehouseId, cancellationToken);

        if (warehouse == null)
            return null;

        var owner = await _userRepository.GetByIdAsync(warehouse.OwnerId, cancellationToken);

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
            CreatedAt = warehouse.CreatedAt ?? DateTime.UtcNow,
            Images = warehouse.Images.Select(x => new WarehouseImageDto
            {
                ImageId = x.MediaId,
                Url = x.MediaUrl
            }).ToList(),
            OwnerName = owner?.FullName,
            OwnerPhone = owner?.Phone,
            OwnerAvatarUrl = owner?.AvatarUrl
        };
    }
}