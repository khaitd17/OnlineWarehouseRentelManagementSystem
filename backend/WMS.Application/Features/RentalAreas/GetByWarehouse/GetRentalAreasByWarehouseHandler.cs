using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.RentalAreas.GetByWarehouse;

public class GetRentalAreasByWarehouseHandler
    : IRequestHandler<GetRentalAreasByWarehouseQuery, List<RentalAreaDto>>
{
    private readonly IRentalAreaRepository _rentalAreaRepository;

    public GetRentalAreasByWarehouseHandler(IRentalAreaRepository rentalAreaRepository)
    {
        _rentalAreaRepository = rentalAreaRepository;
    }

    public async Task<List<RentalAreaDto>> Handle(
        GetRentalAreasByWarehouseQuery request,
        CancellationToken cancellationToken)
    {
        var areas = await _rentalAreaRepository
            .GetWithOccupancyByWarehouseIdAsync(request.WarehouseId, cancellationToken);

        return areas.Select(a => new RentalAreaDto
        {
            Id = a.Id,
            WarehouseId = a.WarehouseId,
            Name = a.Name,
            Size = a.Size,
            Description = a.Description,
            PositionX = a.PositionX,
            PositionY = a.PositionY,
            Width = a.Width,
            Length = a.Length,
            IsOccupied = a.IsOccupied,
            ActiveContractId = a.ActiveContractId,
        }).ToList();
    }
}
