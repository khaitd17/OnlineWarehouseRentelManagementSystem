using Microsoft.EntityFrameworkCore;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence.ScaffoldModels;
using System.Threading.Tasks;

using DomainWarehouse = WMS.Domain.Entities.Warehouse;
using DbWarehouse = WMS.Infrastructure.Persistence.ScaffoldModels.Warehouse;
using WMS.Domain.Entities;

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

public async Task<DomainWarehouse?> GetByIdAsync(
    int warehouseId,
    CancellationToken cancellationToken)
{
    var entity = await _context.Warehouses
        .Include(x => x.WarehouseMedia)
        .FirstOrDefaultAsync(w => w.WarehouseId == warehouseId, cancellationToken);

    if (entity == null)
        return null;

    return new DomainWarehouse
    {
        WarehouseId = entity.WarehouseId,
        OwnerId = entity.OwnerId,
        Name = entity.Name,
        Address = entity.Address,
        Lat = entity.Lat,
        Lng = entity.Lng,
        Description = entity.Description,
        TotalArea = entity.TotalArea,
        AvailableArea = entity.AvailableArea,
        OperatingHours = entity.OperatingHours,
        Status = entity.Status ?? "UNKNOWN",
        CreatedAt = entity.CreatedAt ?? DateTime.UtcNow,

        Images = entity.WarehouseMedia
            .Where(m => m.MediaType == "IMAGE")
            .OrderBy(m => m.DisplayOrder)
            .Select(m => new WarehouseImage
            {
                ImageId = m.MediaId,
                Url = m.MediaUrl
            })
            .ToList()
    };
}

    public async Task<List<DomainWarehouse>> GetByOwnerIdAsync(
    int ownerId,
    CancellationToken cancellationToken)
    {
        var warehouses = await _context.Warehouses
            .Where(w => w.OwnerId == ownerId)
            .ToListAsync(cancellationToken);

        return warehouses.Select(entity => new DomainWarehouse
        {
            WarehouseId = entity.WarehouseId,
            OwnerId = entity.OwnerId,
            Name = entity.Name,
            Address = entity.Address,
            Lat = entity.Lat,
            Lng = entity.Lng,
            Description = entity.Description,
            TotalArea = entity.TotalArea,
            AvailableArea = entity.AvailableArea,
            OperatingHours = entity.OperatingHours,
            Status = entity.Status ?? "UNKNOWN",
            CreatedAt = entity.CreatedAt ?? DateTime.UtcNow
        }).ToList();
    }
    public async System.Threading.Tasks.Task UpdateAsync(
        DomainWarehouse warehouse,
        CancellationToken cancellationToken)
    {
        var entity = await _context.Warehouses
            .FirstOrDefaultAsync(w => w.WarehouseId == warehouse.WarehouseId, cancellationToken)
            ?? throw new KeyNotFoundException("Warehouse not found");

        entity.Name = warehouse.Name;
        entity.Address = warehouse.Address;
        entity.Lat = warehouse.Lat;
        entity.Lng = warehouse.Lng;
        entity.Description = warehouse.Description;
        entity.OperatingHours = warehouse.OperatingHours;
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
    }
    public async Task<bool> ExistsAsync(
        int warehouseId,
        CancellationToken cancellationToken)
    {
        return await _context.Warehouses
            .AnyAsync(x => x.WarehouseId == warehouseId, cancellationToken);
    }

}