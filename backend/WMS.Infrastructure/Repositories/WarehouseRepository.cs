using Microsoft.EntityFrameworkCore;
using WMS.Domain.Interfaces;
using System.Threading.Tasks;
using WMS.Domain.Entities;
using WMS.Infrastructure.Persistence;

namespace WMS.Infrastructure.Repositories;

public class WarehouseRepository : IWarehouseRepository
{
    private readonly ApplicationDbContext _context;

    public WarehouseRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<int> CreateAsync(Warehouse warehouse, CancellationToken cancellationToken)
    {
        var entity = new Warehouse
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

public async Task<Warehouse?> GetByIdAsync(
    int warehouseId,
    CancellationToken cancellationToken)
{
    var entity = await _context.Warehouses
        .Include(x => x.WarehouseMedia)
        .FirstOrDefaultAsync(w => w.WarehouseId == warehouseId, cancellationToken);

    if (entity == null)
        return null;

    return new Warehouse
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
    };
}

    public async Task<List<Warehouse>> GetByOwnerIdAsync(
    int ownerId,
    CancellationToken cancellationToken)
    {
        var warehouses = await _context.Warehouses
            .Where(w => w.OwnerId == ownerId)
            .ToListAsync(cancellationToken);

        return warehouses.Select(entity => new Warehouse
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
        Warehouse warehouse,
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

    public async Task<List<Warehouse>> GetApprovedWarehousesAsync(
        int limit,
        CancellationToken cancellationToken)
    {
        var warehouses = await _context.Warehouses
            .Include(w => w.WarehouseMedia)
            .Include(w => w.Ratings)
            .Where(w => w.Status == "APPROVED")
            .OrderByDescending(w => w.CreatedAt)
            .Take(limit)
            .ToListAsync(cancellationToken);

        return warehouses.Select(entity => new Warehouse
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

}