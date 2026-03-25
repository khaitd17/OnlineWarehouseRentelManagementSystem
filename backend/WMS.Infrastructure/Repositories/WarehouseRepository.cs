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
            Width = warehouse.Width,
            Length = warehouse.Length,
            AvailableArea = warehouse.AvailableArea,
            OperatingHours = warehouse.OperatingHours,
            Is24HoursAccess = warehouse.Is24HoursAccess,
            OpenTime = warehouse.OpenTime,
            CloseTime = warehouse.CloseTime,
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
        .Include(x => x.WarehouseDocuments)
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
        Width = entity.Width,
        Length = entity.Length,
        AvailableArea = entity.AvailableArea,
        OperatingHours = entity.OperatingHours,
        Is24HoursAccess = entity.Is24HoursAccess,
        OpenTime = entity.OpenTime,
        CloseTime = entity.CloseTime,
        MainDoorDirection = entity.MainDoorDirection,
        PricePerM2 = entity.PricePerM2,
        Status = entity.Status ?? "UNKNOWN",
        CreatedAt = entity.CreatedAt ?? DateTime.UtcNow,
        WarehouseMedia = entity.WarehouseMedia.Select(m => new WarehouseMedium
        {
            MediaId = m.MediaId,
            WarehouseId = m.WarehouseId,
            MediaUrl = m.MediaUrl,
            MediaType = m.MediaType,
            IsPrimary = m.IsPrimary,
            DisplayOrder = m.DisplayOrder
        }).ToList(),
        WarehouseDocuments = entity.WarehouseDocuments.Select(d => new WarehouseDocument
        {
            DocumentId = d.DocumentId,
            WarehouseId = d.WarehouseId,
            DocumentType = d.DocumentType,
            DocumentUrl = d.DocumentUrl,
            Status = d.Status
        }).ToList()
    };
}

    public async Task<List<Warehouse>> GetByOwnerIdAsync(
    int ownerId,
    CancellationToken cancellationToken)
    {
        var warehouses = await _context.Warehouses
            .Include(w => w.WarehouseMedia)
            .Where(w => w.OwnerId == ownerId && w.Status != "DELETED")
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
            Width = entity.Width,
            Length = entity.Length,
            AvailableArea = entity.AvailableArea,
            OperatingHours = entity.OperatingHours,
            Is24HoursAccess = entity.Is24HoursAccess,
            OpenTime = entity.OpenTime,
            CloseTime = entity.CloseTime,
            MainDoorDirection = entity.MainDoorDirection,
            PricePerM2 = entity.PricePerM2,
            Status = entity.Status ?? "UNKNOWN",
            CreatedAt = entity.CreatedAt ?? DateTime.UtcNow,
            WarehouseMedia = entity.WarehouseMedia.Select(m => new WarehouseMedium
            {
                MediaId = m.MediaId,
                WarehouseId = m.WarehouseId,
                MediaUrl = m.MediaUrl,
                MediaType = m.MediaType,
                IsPrimary = m.IsPrimary,
                DisplayOrder = m.DisplayOrder
            }).ToList()
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
        entity.TotalArea = warehouse.TotalArea;
        entity.Width = warehouse.Width;
        entity.Length = warehouse.Length;
        entity.AvailableArea = warehouse.AvailableArea;
        entity.OperatingHours = warehouse.OperatingHours;
        entity.Is24HoursAccess = warehouse.Is24HoursAccess;
        entity.OpenTime = warehouse.OpenTime;
        entity.CloseTime = warehouse.CloseTime;
        entity.MainDoorDirection = warehouse.MainDoorDirection;
        entity.Status = warehouse.Status ?? entity.Status;
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

    public async Task DeleteAsync(int warehouseId, CancellationToken cancellationToken)
    {
        var entity = await _context.Warehouses
            .FirstOrDefaultAsync(w => w.WarehouseId == warehouseId, cancellationToken);
            
        if (entity != null)
        {
            entity.Status = "DELETED";
            
            // Soft delete all associated equipments
            var equipments = await _context.Equipments
                .Where(e => e.WarehouseId == warehouseId)
                .ToListAsync(cancellationToken);
                
            foreach (var equipment in equipments)
            {
                equipment.Status = "DELETED";
            }

            await _context.SaveChangesAsync(cancellationToken);
        }
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
            Is24HoursAccess = entity.Is24HoursAccess,
            OpenTime = entity.OpenTime,
            CloseTime = entity.CloseTime,
            PricePerM2 = entity.PricePerM2,
            Status = entity.Status ?? "UNKNOWN",
            CreatedAt = entity.CreatedAt ?? DateTime.UtcNow,
            WarehouseMedia = entity.WarehouseMedia.Select(m => new WarehouseMedium
            {
                MediaId = m.MediaId,
                WarehouseId = m.WarehouseId,
                MediaUrl = m.MediaUrl,
                MediaType = m.MediaType,
                IsPrimary = m.IsPrimary,
                DisplayOrder = m.DisplayOrder
            }).ToList()
        }).ToList();
    }

    public async Task<List<VWarehouseOccupancy>> GetOccupancyStatsByOwnerAsync(
        int ownerId,
        CancellationToken cancellationToken)
    {
        return await _context.VWarehouseOccupancies
            .Where(v => _context.Warehouses.Any(w => w.WarehouseId == v.WarehouseId && w.OwnerId == ownerId))
            .ToListAsync(cancellationToken);
    }
}