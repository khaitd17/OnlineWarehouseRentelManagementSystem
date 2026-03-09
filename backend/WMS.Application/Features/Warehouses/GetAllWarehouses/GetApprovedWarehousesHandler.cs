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

        return warehouses.Select(w => new ApprovedWarehouseDto
        {
            WarehouseId = w.WarehouseId,
            Name = w.Name,
            Address = w.Address,
            Description = w.Description,
            TotalArea = w.TotalArea,
            AvailableArea = w.AvailableArea,
            ImageUrl = w.Images.FirstOrDefault()?.Url,
            CreatedAt = w.CreatedAt
        }).ToList();
    }
}
