using Microsoft.EntityFrameworkCore;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence.ScaffoldModels;

using DomainWarehouse = WMS.Domain.Entities.Warehouse;
using DbWarehouse = WMS.Infrastructure.Persistence.ScaffoldModels.Warehouse;

namespace WMS.Infrastructure.Repositories;

public class WarehouseRepository : IWarehouseRepository
{
    private readonly ApplicationDbContext _context;

    public WarehouseRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<int> CreateAsync(DomainWarehouse warehouse, CancellationToken cancellationToken)
    {
        var entity = new DbWarehouse
        {
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
            CreatedAt = warehouse.CreatedAt
        };

        _context.Warehouses.Add(entity);

        await _context.SaveChangesAsync(cancellationToken);

        return entity.WarehouseId;
    }

    public async Task<int?> FindWarehouseOwnerById(
        int warehouseId,
        CancellationToken cancellationToken)
    {
        return await _context.Warehouses
            .Where(w => w.WarehouseId == warehouseId)
            .Select(w => (int?)w.OwnerId)
            .FirstOrDefaultAsync(cancellationToken);
    }
}