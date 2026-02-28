using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common.Interfaces;
using WMS.Application.Common.Models;
using WMS.Domain.Entities;
using System.Linq.Dynamic.Core;

namespace WMS.Application.Features.Admin.Queries.GetWarehousesByOwner;

public class GetWarehousesByOwnerHandler : IRequestHandler<GetWarehousesByOwnerQuery, ApiResponse<PaginatedList<WarehouseDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetWarehousesByOwnerHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<PaginatedList<WarehouseDto>>> Handle(GetWarehousesByOwnerQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Warehouses.Include(w => w.Owner).AsQueryable();

        if (request.OwnerId.HasValue)
        {
            query = query.Where(w => w.OwnerId == request.OwnerId.Value);
        }

        if (!string.IsNullOrEmpty(request.Search))
        {
            query = query.Where(w => w.Name.Contains(request.Search) || w.Address.Contains(request.Search));
        }

        if (!string.IsNullOrEmpty(request.SortBy))
        {
            var orderDirection = request.IsAscending ? "ascending" : "descending";
            query = query.OrderBy($"{request.SortBy} {orderDirection}");
        }
        else
        {
            query = query.OrderByDescending(w => w.CreatedAt);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(w => new WarehouseDto(
                w.WarehouseId,
                w.Name,
                w.Address,
                w.Owner.FullName,
                w.TotalArea,
                w.AvailableArea,
                w.Status ?? "PENDING",
                w.CreatedAt ?? DateTime.MinValue
            ))
            .ToListAsync(cancellationToken);

        var paginatedList = new PaginatedList<WarehouseDto>(items, totalCount, request.PageNumber, request.PageSize);
        return ApiResponse<PaginatedList<WarehouseDto>>.SuccessResult(paginatedList);
    }
}
