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
            WarehouseType = warehouse.WarehouseType,
            Height = warehouse.Height,
            AvailableArea = warehouse.AvailableArea,
            OperatingHours = warehouse.OperatingHours,
            Is24HoursAccess = warehouse.Is24HoursAccess,
            OpenTime = warehouse.OpenTime,
            CloseTime = warehouse.CloseTime,
            MainDoorDirection = warehouse.MainDoorDirection,
            PricePerM2 = warehouse.PricePerM2,
            Status = warehouse.Status,
            GatePosition = warehouse.GatePosition,
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
        Height = entity.Height,
        AvailableArea = entity.AvailableArea,
        OperatingHours = entity.OperatingHours,
        WarehouseType = entity.WarehouseType,
        Is24HoursAccess = entity.Is24HoursAccess,
        OpenTime = entity.OpenTime,
        CloseTime = entity.CloseTime,
        MainDoorDirection = entity.MainDoorDirection,
        PricePerM2 = entity.PricePerM2,
        Status = entity.Status ?? "UNKNOWN",
        CreatedAt = entity.CreatedAt ?? DateTime.UtcNow,
        ApprovedAt = entity.ApprovedAt,         // ← required for re-approval detection
        ApprovedBy = entity.ApprovedBy,
        RejectionReason = entity.RejectionReason,
        SubmissionType = entity.SubmissionType ?? "NEW",
        PendingChangeNote = entity.PendingChangeNote,
        BoundaryPoints = entity.BoundaryPoints,
        GatePosition = entity.GatePosition,
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
            .Where(w => w.OwnerId == ownerId)
            .OrderByDescending(w => w.CreatedAt)
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
            Height = entity.Height,
            AvailableArea = entity.AvailableArea,
            WarehouseType = entity.WarehouseType,
            OperatingHours = entity.OperatingHours,
            Is24HoursAccess = entity.Is24HoursAccess,
            OpenTime = entity.OpenTime,
            CloseTime = entity.CloseTime,
            MainDoorDirection = entity.MainDoorDirection,
            PricePerM2 = entity.PricePerM2,
            Status = entity.Status ?? "UNKNOWN",
            GatePosition = entity.GatePosition,
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
        entity.Height = warehouse.Height;
        entity.AvailableArea = warehouse.AvailableArea;
        entity.OperatingHours = warehouse.OperatingHours;
        entity.Is24HoursAccess = warehouse.Is24HoursAccess;
        entity.OpenTime = warehouse.OpenTime;
        entity.CloseTime = warehouse.CloseTime;
        entity.WarehouseType        = warehouse.WarehouseType;
        entity.MainDoorDirection    = warehouse.MainDoorDirection;
        entity.PricePerM2           = warehouse.PricePerM2;
        entity.Status               = warehouse.Status ?? entity.Status;
        entity.SubmissionType       = warehouse.SubmissionType ?? "NEW";
        entity.PendingChangeNote    = warehouse.PendingChangeNote;
        entity.BoundaryPoints       = warehouse.BoundaryPoints;
        entity.GatePosition         = warehouse.GatePosition;
        entity.UpdatedAt            = DateTime.UtcNow;

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
            
        if (entity == null) return;

        // Nếu kho đã DELETED hoặc là DRAFT → hard delete (xóa hẳn khỏi DB)
        if (entity.Status == "DELETED" || entity.Status == "DRAFT")
        {
            var id = warehouseId;
            // Cascade xóa các bảng phụ theo thứ tự FK
            await _context.Database.ExecuteSqlRawAsync($@"
                DELETE FROM warehouse_membership_skills WHERE membership_id IN (SELECT membership_id FROM warehouse_memberships WHERE warehouse_id = {id});
                DELETE FROM warehouse_membership_zones WHERE membership_id IN (SELECT membership_id FROM warehouse_memberships WHERE warehouse_id = {id});
                DELETE FROM warehouse_memberships WHERE warehouse_id = {id};
                DELETE FROM warehouse_media WHERE warehouse_id = {id};
                DELETE FROM warehouse_documents WHERE warehouse_id = {id};
                DELETE FROM zones WHERE warehouse_id = {id};
                DELETE FROM warehouse_shifts WHERE warehouse_id = {id};
                DELETE FROM equipments WHERE warehouse_id = {id};
                DELETE FROM warehouses WHERE warehouse_id = {id};
            ", cancellationToken);
            return;
        }

        // Soft delete (APPROVED, PENDING, HIDDEN...)
        entity.Status = "DELETED";
        var equipments = await _context.Equipments
            .Where(e => e.WarehouseId == warehouseId)
            .ToListAsync(cancellationToken);
        foreach (var equipment in equipments)
            equipment.Status = "DELETED";

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task RestoreAsync(int warehouseId, CancellationToken cancellationToken)
    {
        var entity = await _context.Warehouses
            .FirstOrDefaultAsync(w => w.WarehouseId == warehouseId, cancellationToken);
            
        if (entity == null || entity.Status != "DELETED") return;

        // Khôi phục lại trạng thái. Nếu đã có ApprovedAt thì là kho đã từng duyệt -> APPROVED, nếu chưa thì PENDING
        entity.Status = entity.ApprovedAt.HasValue ? "APPROVED" : "PENDING";
        
        // Khôi phục equipments
        var equipments = await _context.Equipments
            .Where(e => e.WarehouseId == warehouseId && e.Status == "DELETED")
            .ToListAsync(cancellationToken);
            
        foreach (var equipment in equipments)
            equipment.Status = "AVAILABLE"; // hoặc trạng thái mặc định của equipment

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<Warehouse>> GetApprovedWarehousesAsync(
        int limit,
        CancellationToken cancellationToken)
    {
        var warehouses = await _context.Warehouses
            .Include(w => w.WarehouseMedia)
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
            WarehouseType = entity.WarehouseType,
            OperatingHours = entity.OperatingHours,
            Is24HoursAccess = entity.Is24HoursAccess,
            OpenTime = entity.OpenTime,
            CloseTime = entity.CloseTime,
            PricePerM2 = entity.PricePerM2,
            Status = entity.Status ?? "UNKNOWN",
            GatePosition = entity.GatePosition,
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

    /// <summary>
    /// Tính tổng diện tích đang được thuê cho một kho cụ thể.
    /// Dựa trên RequestedArea từ RentalRequest liên kết với Contract có status chiếm diện tích.
    /// </summary>
    public async Task<double> GetRentedAreaAsync(int warehouseId, CancellationToken cancellationToken)
    {
        var occupyingStatuses = new[] { "ACTIVE", "PENDING_PAYMENT", "PENDING_TERMINATION", "PENDING_CLOSE" };

        var rentedArea = await _context.Contracts
            .Where(c => c.WarehouseId == warehouseId && occupyingStatuses.Contains(c.Status))
            .Join(_context.Set<WMS.Domain.Entities.RentalRequest>(),
                c => c.RequestId,
                r => r.RequestId,
                (c, r) => r.RequestedArea)
            .SumAsync(cancellationToken);

        return rentedArea;
    }

    /// <summary>
    /// Tính tổng diện tích đang được thuê cho TẤT CẢ kho (batch).
    /// </summary>
    public async Task<Dictionary<int, double>> GetAllRentedAreasAsync(CancellationToken cancellationToken)
    {
        var occupyingStatuses = new[] { "ACTIVE", "PENDING_PAYMENT", "PENDING_TERMINATION", "PENDING_CLOSE" };

        var result = await _context.Contracts
            .Where(c => occupyingStatuses.Contains(c.Status))
            .Join(_context.Set<WMS.Domain.Entities.RentalRequest>(),
                c => c.RequestId,
                r => r.RequestId,
                (c, r) => new { c.WarehouseId, r.RequestedArea })
            .GroupBy(x => x.WarehouseId)
            .Select(g => new { WarehouseId = g.Key, RentedArea = g.Sum(x => x.RequestedArea) })
            .ToDictionaryAsync(x => x.WarehouseId, x => x.RentedArea, cancellationToken);

        return result;
    }
}