using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;
using WMS.Infrastructure.Persistence;
using SystemTask = System.Threading.Tasks.Task;

using DomainRentalRequest = WMS.Domain.Entities.RentalRequest;
using DbRentalRequest = WMS.Domain.Entities.RentalRequest;

namespace WMS.Infrastructure.Repositories;

public class RentalRequestRepository : IRentalRequestRepository
{
    private readonly ApplicationDbContext _context;

    public RentalRequestRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DomainRentalRequest?> GetByIdAsync(int requestId)
    {
        var dbRequest = await _context.RentalRequests
            .Include(r => r.Warehouse)  // Include Warehouse for notifications
            .FirstOrDefaultAsync(r => r.RequestId == requestId);

        return dbRequest != null ? MapToDomain(dbRequest) : null;
    }

    public async Task<IEnumerable<DomainRentalRequest>> GetByRenterIdAsync(int renterId)
    {
        var dbRequests = await _context.RentalRequests
            .Where(r => r.RenterId == renterId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return dbRequests.Select(MapToDomain).ToList();
    }

    public async Task<IEnumerable<DomainRentalRequest>> GetByWarehouseIdAsync(int warehouseId)
    {
        var dbRequests = await _context.RentalRequests
            .Where(r => r.WarehouseId == warehouseId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return dbRequests.Select(MapToDomain).ToList();
    }

    public async Task<IEnumerable<DomainRentalRequest>> GetPendingByWarehouseOwnerIdAsync(int ownerId)
    {
        var dbRequests = await _context.RentalRequests
            .Where(r => r.Status == "PENDING" && r.Warehouse.OwnerId == ownerId)
            .OrderBy(r => r.CreatedAt)
            .ToListAsync();

        return dbRequests.Select(MapToDomain).ToList();
    }

    public async Task<IEnumerable<DomainRentalRequest>> GetByStatusAsync(string status)
    {
        var dbRequests = await _context.RentalRequests
            .Where(r => r.Status == status)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return dbRequests.Select(MapToDomain).ToList();
    }

    public async Task<IEnumerable<DomainRentalRequest>> GetByOwnerIdAsync(int ownerId)
    {
        var dbRequests = await _context.RentalRequests
            .Include(r => r.Warehouse)
            .Where(r => r.Warehouse.OwnerId == ownerId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return dbRequests.Select(MapToDomain).ToList();
    }

    public async Task<IEnumerable<DomainRentalRequest>> GetByWarehouseOwnerIdAsync(int ownerId)
    {
        // Get all requests for owner's warehouses (no status filter)
        var dbRequests = await _context.RentalRequests
            .Include(r => r.Warehouse)
            .Where(r => r.Warehouse.OwnerId == ownerId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return dbRequests.Select(MapToDomain).ToList();
    }

    public async Task<int> AddAsync(DomainRentalRequest request)
    {
        var dbRequest = new DbRentalRequest
        {
            RenterId = request.RenterId,
            WarehouseId = request.WarehouseId,
            RentalAreaId = request.RentalAreaId,
            RequestedArea = request.RequestedArea,
            StartDate = request.StartDate,
            DurationMonths = request.DurationMonths,
            Status = request.Status,
            Notes = request.Notes,
            CreatedAt = request.CreatedAt,
            IsCustomArea = request.IsCustomArea,
            ProposedPositionX = request.ProposedPositionX,
            ProposedPositionY = request.ProposedPositionY,
            ProposedWidth = request.ProposedWidth,
            ProposedLength = request.ProposedLength,
            BaseRentalAreaId = request.BaseRentalAreaId,
            // Extension zone (L-shape)
            HasExtensionZone = request.HasExtensionZone,
            ExtensionPositionX = request.ExtensionPositionX,
            ExtensionPositionY = request.ExtensionPositionY,
            ExtensionWidth = request.ExtensionWidth,
            ExtensionLength = request.ExtensionLength,
            // Multi-zone
            AdditionalZonesJson = request.AdditionalZonesJson
        };

        _context.RentalRequests.Add(dbRequest);
        await _context.SaveChangesAsync();

        return dbRequest.RequestId;
    }

    public async SystemTask UpdateAsync(DomainRentalRequest request)
    {
        var dbRequest = await _context.RentalRequests.FindAsync(request.RequestId);
        if (dbRequest == null)
            throw new InvalidOperationException($"Rental request {request.RequestId} not found");

        dbRequest.Status = request.Status;
        dbRequest.ReviewedBy = request.ReviewedBy;
        dbRequest.ReviewedAt = request.ReviewedAt;
        dbRequest.RejectionReason = request.RejectionReason;
        dbRequest.ContractImageUrl = request.ContractImageUrl;
        dbRequest.CancellationReason = request.CancellationReason;
        dbRequest.CancelledAt = request.CancelledAt;
        dbRequest.CancelledBy = request.CancelledBy;
        dbRequest.UpdatedAt = DateTime.UtcNow;

        // Zone assignment fields
        dbRequest.IsCustomArea = request.IsCustomArea;
        dbRequest.IsOwnerAssigned = request.IsOwnerAssigned;
        dbRequest.ProposedPositionX = request.ProposedPositionX;
        dbRequest.ProposedPositionY = request.ProposedPositionY;
        dbRequest.ProposedWidth = request.ProposedWidth;
        dbRequest.ProposedLength = request.ProposedLength;
        dbRequest.BaseRentalAreaId = request.BaseRentalAreaId;
        // Extension zone (L-shape)
        dbRequest.HasExtensionZone = request.HasExtensionZone;
        dbRequest.ExtensionPositionX = request.ExtensionPositionX;
        dbRequest.ExtensionPositionY = request.ExtensionPositionY;
        dbRequest.ExtensionWidth = request.ExtensionWidth;
        dbRequest.ExtensionLength = request.ExtensionLength;
        // Multi-zone
        dbRequest.AdditionalZonesJson = request.AdditionalZonesJson;

        await _context.SaveChangesAsync();
    }

    public async Task<bool> HasPendingRequestAsync(int renterId, int warehouseId)
    {
        return await _context.RentalRequests
            .AnyAsync(r => r.RenterId == renterId && 
                          r.WarehouseId == warehouseId && 
                          r.Status == "PENDING");
    }

    private DomainRentalRequest MapToDomain(DbRentalRequest dbRequest)
    {
        if (dbRequest == null) return null!;

        return new DomainRentalRequest
        {
            RequestId = dbRequest.RequestId,
            RenterId = dbRequest.RenterId,
            WarehouseId = dbRequest.WarehouseId,
            RentalAreaId = dbRequest.RentalAreaId,
            RequestedArea = dbRequest.RequestedArea,
            StartDate = dbRequest.StartDate,
            DurationMonths = dbRequest.DurationMonths,
            Status = dbRequest.Status,
            Notes = dbRequest.Notes,
            CreatedAt = dbRequest.CreatedAt,
            UpdatedAt = dbRequest.UpdatedAt,
            ReviewedBy = dbRequest.ReviewedBy,
            ReviewedAt = dbRequest.ReviewedAt,
            RejectionReason = dbRequest.RejectionReason,
            ContractImageUrl = dbRequest.ContractImageUrl,
            
            // Custom Area Fields
            IsCustomArea = dbRequest.IsCustomArea,
            IsOwnerAssigned = dbRequest.IsOwnerAssigned,
            ProposedPositionX = dbRequest.ProposedPositionX,
            ProposedPositionY = dbRequest.ProposedPositionY,
            ProposedWidth = dbRequest.ProposedWidth,
            ProposedLength = dbRequest.ProposedLength,
            BaseRentalAreaId = dbRequest.BaseRentalAreaId,
            
            // Extension Zone (L-shape)
            HasExtensionZone = dbRequest.HasExtensionZone,
            ExtensionPositionX = dbRequest.ExtensionPositionX,
            ExtensionPositionY = dbRequest.ExtensionPositionY,
            ExtensionWidth = dbRequest.ExtensionWidth,
            ExtensionLength = dbRequest.ExtensionLength,
            
            // Multi-zone
            AdditionalZonesJson = dbRequest.AdditionalZonesJson,
            
            // Navigation
            Warehouse = dbRequest.Warehouse,
            Renter = dbRequest.Renter,
            ReviewedByNavigation = dbRequest.ReviewedByNavigation
        };
    }
}
