using MediatR;
using WMS.Application.Common.Interfaces;
using WMS.Application.Common.Models;
using WMS.Domain.Constants;
using WMS.Domain.Entities;

namespace WMS.Application.Features.Admin.Commands.CreateWarehouse;

public class CreateWarehouseCommandHandler : IRequestHandler<CreateWarehouseCommand, ApiResponse<int>>
{
    private readonly IApplicationDbContext _context;

    public CreateWarehouseCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<int>> Handle(CreateWarehouseCommand request, CancellationToken cancellationToken)
    {
        var warehouse = new Warehouse
        {
            Name = request.Name,
            Description = request.Description,
            Address = request.Address,
            TotalArea = request.TotalArea ?? 0,
            AvailableArea = request.AvailableArea ?? 0,
            Lat = request.Lat,
            Lng = request.Lng,
            OperatingHours = request.OperatingHours,
            OwnerId = request.OwnerId,
            Status = WarehouseStatus.PENDING,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        if (request.MediaUrls != null && request.MediaUrls.Any())
        {
            foreach (var url in request.MediaUrls)
            {
                warehouse.WarehouseMedia.Add(new WarehouseMedium
                {
                    MediaUrl = url,
                    MediaType = "IMAGE",
                    IsPrimary = request.MediaUrls.First() == url,
                    CreatedAt = DateTime.Now
                });
            }
        }

        _context.Warehouses.Add(warehouse);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<int>.SuccessResult(warehouse.WarehouseId, "Warehouse created successfully");
    }
}
