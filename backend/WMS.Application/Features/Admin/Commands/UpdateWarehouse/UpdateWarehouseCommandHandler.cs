using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using WMS.Application.Common.Interfaces;
using WMS.Application.Common.Models;
using WMS.Domain.Entities;

namespace WMS.Application.Features.Admin.Commands.UpdateWarehouse;

public class UpdateWarehouseCommandHandler : IRequestHandler<UpdateWarehouseCommand, ApiResponse<bool>>
{
    private readonly IApplicationDbContext _context;

    public UpdateWarehouseCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<bool>> Handle(UpdateWarehouseCommand request, CancellationToken cancellationToken)
    {
        var warehouse = await _context.Warehouses.FindAsync(new object[] { request.WarehouseId }, cancellationToken);
        if (warehouse == null)
        {
            return ApiResponse<bool>.FailureResult("Warehouse not found");
        }

        warehouse.Name = request.Name;
        warehouse.Description = request.Description;
        warehouse.Address = request.Address;
        warehouse.TotalArea = request.TotalArea ?? warehouse.TotalArea;
        warehouse.AvailableArea = request.AvailableArea ?? warehouse.AvailableArea;
        warehouse.Lat = request.Lat;
        warehouse.Lng = request.Lng;
        warehouse.OperatingHours = request.OperatingHours;
        warehouse.OwnerId = request.OwnerId;
        warehouse.Status = request.Status;
        warehouse.UpdatedAt = DateTime.Now;

        // Update Media (Replace all for simplicity)
        if (request.MediaUrls != null)
        {
            var existingMedia = await _context.WarehouseMedia
                .Where(m => m.WarehouseId == warehouse.WarehouseId)
                .ToListAsync(cancellationToken);

            _context.WarehouseMedia.RemoveRange(existingMedia);

            foreach (var url in request.MediaUrls)
            {
                _context.WarehouseMedia.Add(new WarehouseMedium
                {
                    WarehouseId = warehouse.WarehouseId,
                    MediaUrl = url,
                    MediaType = "IMAGE",
                    IsPrimary = request.MediaUrls.First() == url,
                    CreatedAt = DateTime.Now
                });
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.SuccessResult(true, "Warehouse updated successfully");
    }
}
