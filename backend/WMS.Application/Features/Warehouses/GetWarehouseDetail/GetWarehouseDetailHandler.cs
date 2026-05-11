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

        // Determine overall document status
        string docStatus = "MISSING";
        if (warehouse.WarehouseDocuments != null && warehouse.WarehouseDocuments.Any())
        {
            // For simplicity, take the status of the most recent document or first one
            docStatus = warehouse.WarehouseDocuments.First().Status ?? "PENDING";
        }

        return new WarehouseDetailDto
        {
            WarehouseId = warehouse.WarehouseId,
            OwnerId = warehouse.OwnerId,
            Name = warehouse.Name,
            Address = warehouse.Address,
            Lat = warehouse.Lat,
            Lng = warehouse.Lng,
            Description = warehouse.Description,
            WarehouseType = warehouse.WarehouseType,
            TotalArea = warehouse.TotalArea,
            Height = warehouse.Height,
            AvailableArea = warehouse.AvailableArea,
            PricePerM2 = warehouse.PricePerM2,
            OperatingHours = warehouse.OperatingHours,
            Is24HoursAccess = warehouse.Is24HoursAccess,
            OpenTime = warehouse.OpenTime,
            CloseTime = warehouse.CloseTime,
            MainDoorDirection = warehouse.MainDoorDirection,
            Status = warehouse.Status,
            CreatedAt = warehouse.CreatedAt ?? DateTime.UtcNow,
            Images = warehouse.Images.Select(x => new WarehouseImageDto
            {
                ImageId = x.MediaId,
                Url = x.MediaUrl
            }).ToList(),
            DocumentStatus = docStatus,
            Documents = (warehouse.WarehouseDocuments ?? new List<Domain.Entities.WarehouseDocument>())
                .Select(d => new WarehouseDocumentDto
                {
                    DocumentId = d.DocumentId,
                    DocumentType = d.DocumentType,
                    DocumentUrl = d.DocumentUrl,
                    Status = d.Status,
                    CreatedAt = d.CreatedAt
                }).ToList(),
            OwnerName = owner?.FullName,
            OwnerPhone = owner?.Phone,
            OwnerAvatarUrl = owner?.AvatarUrl,
            BoundaryPoints = warehouse.BoundaryPoints,
            GatePosition = warehouse.GatePosition
        };
    }
}