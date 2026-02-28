using MediatR;
using Microsoft.EntityFrameworkCore;
using WMS.Application.Common.Interfaces;
using WMS.Application.Common.Models;

namespace WMS.Application.Features.Admin.Queries.GetWarehouseById;

public class GetWarehouseByIdHandler : IRequestHandler<GetWarehouseByIdQuery, ApiResponse<WarehouseDetailDto>>
{
    private readonly IApplicationDbContext _context;

    public GetWarehouseByIdHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<WarehouseDetailDto>> Handle(GetWarehouseByIdQuery request, CancellationToken cancellationToken)
    {
        var warehouse = await _context.Warehouses
            .Include(w => w.Owner)
            .Include(w => w.WarehouseMedia)
            .Include(w => w.ApprovedByNavigation)
            .FirstOrDefaultAsync(w => w.WarehouseId == request.Id, cancellationToken);

        if (warehouse == null)
        {
            return ApiResponse<WarehouseDetailDto>.FailureResult("Warehouse not found");
        }

        var dto = new WarehouseDetailDto(
            warehouse.WarehouseId,
            warehouse.OwnerId,
            warehouse.Name,
            warehouse.Address,
            warehouse.Lat,
            warehouse.Lng,
            warehouse.Description,
            warehouse.TotalArea,
            warehouse.AvailableArea,
            warehouse.OperatingHours,
            warehouse.Status,
            warehouse.CreatedAt,
            warehouse.UpdatedAt,
            warehouse.ApprovedAt,
            warehouse.ApprovedBy,
            warehouse.ApprovedByNavigation?.FullName,
            warehouse.RejectionReason,
            warehouse.Owner.FullName,
            warehouse.Owner.Email,
            warehouse.WarehouseMedia.Select(m => new WarehouseMediaDto(
                m.MediaId,
                m.MediaUrl,
                m.MediaType,
                m.DisplayOrder,
                m.IsPrimary
            )).ToList()
        );

        return ApiResponse<WarehouseDetailDto>.SuccessResult(dto);
    }
}
