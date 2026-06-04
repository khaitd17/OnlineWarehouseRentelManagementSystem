using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Warehouses.GetAllWarehouses;

public class GetApprovedWarehousesHandler
    : IRequestHandler<GetApprovedWarehousesQuery, List<ApprovedWarehouseDto>>
{
    private readonly IWarehouseRepository _repository;

    public GetApprovedWarehousesHandler(IWarehouseRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<ApprovedWarehouseDto>> Handle(
        GetApprovedWarehousesQuery request,
        CancellationToken cancellationToken)
    {
        var warehouses = await _repository.GetApprovedWarehousesAsync(
            request.Limit, cancellationToken);

        // ── Compute AvailableArea dynamically from active contracts ──
        var rentedAreas = await _repository.GetAllRentedAreasAsync(cancellationToken);

        return warehouses.Select(w => new ApprovedWarehouseDto
        {
            WarehouseId = w.WarehouseId,
            Name = w.Name,
            Address = w.Address,
            Description = w.Description,
            TotalArea = w.TotalArea,
            AvailableArea = Math.Max(0, w.TotalArea - (rentedAreas.TryGetValue(w.WarehouseId, out var rented) ? rented : 0)),
            ImageUrl = w.Images.FirstOrDefault()?.MediaUrl,
            CreatedAt = w.CreatedAt ?? DateTime.UtcNow,
            WarehouseType = w.WarehouseType,
            PricePerM2 = w.PricePerM2
        }).ToList();
    }
}
