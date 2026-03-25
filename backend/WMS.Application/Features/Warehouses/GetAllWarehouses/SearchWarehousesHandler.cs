using MediatR;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Warehouses.GetAllWarehouses;

public class SearchWarehousesHandler
    : IRequestHandler<SearchWarehousesQuery, SearchWarehouseResult>
{
    private readonly IWarehouseRepository _repository;

    public SearchWarehousesHandler(IWarehouseRepository repository)
    {
        _repository = repository;
    }

    public async Task<SearchWarehouseResult> Handle(
        SearchWarehousesQuery request,
        CancellationToken cancellationToken)
    {
        // Get all approved warehouses (no limit) then filter in memory
        var all = await _repository.GetApprovedWarehousesAsync(int.MaxValue, cancellationToken);

        var query = all.AsEnumerable();

        // Filter: province (address contains)
        if (!string.IsNullOrWhiteSpace(request.Province))
        {
            query = query.Where(w =>
                w.Address.Contains(request.Province, StringComparison.OrdinalIgnoreCase));
        }

        // Filter: warehouse type (name or description contains keyword)
        if (!string.IsNullOrWhiteSpace(request.WarehouseType)
            && request.WarehouseType != "all")
        {
            query = query.Where(w =>
                (w.Name?.Contains(request.WarehouseType, StringComparison.OrdinalIgnoreCase) == true) ||
                (w.Description?.Contains(request.WarehouseType, StringComparison.OrdinalIgnoreCase) == true));
        }

        // Filter: area
        if (request.MinArea.HasValue)
            query = query.Where(w => w.TotalArea >= request.MinArea.Value);
        if (request.MaxArea.HasValue)
            query = query.Where(w => w.TotalArea <= request.MaxArea.Value);

        // Sort
        query = request.SortBy switch
        {
            "area_asc"  => query.OrderBy(w => w.TotalArea),
            "area_desc" => query.OrderByDescending(w => w.TotalArea),
            _           => query.OrderByDescending(w => w.CreatedAt)
        };

        var list = query.ToList();
        var total = list.Count;

        var items = list
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(w => new ApprovedWarehouseDto
            {
                WarehouseId   = w.WarehouseId,
                Name          = w.Name,
                Address       = w.Address,
                Description   = w.Description,
                TotalArea     = w.TotalArea,
                AvailableArea = w.AvailableArea,
                ImageUrl      = w.Images.FirstOrDefault()?.MediaUrl,
                CreatedAt     = w.CreatedAt ?? DateTime.UtcNow,
                PricePerM2    = w.PricePerM2
            })
            .ToList();

        return new SearchWarehouseResult
        {
            Total    = total,
            Page     = request.Page,
            PageSize = request.PageSize,
            Items    = items
        };
    }
}
