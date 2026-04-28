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
            ExtensionLength = request.ExtensionLength
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
        // Using reflection to bypass private constructor
#pragma warning disable SYSLIB0050 // FormatterServices obsolete warning
        var domainRequest = (DomainRentalRequest)System.Runtime.Serialization.FormatterServices
            .GetUninitializedObject(typeof(DomainRentalRequest));
#pragma warning restore SYSLIB0050

        var requestIdProp = typeof(DomainRentalRequest).GetProperty("RequestId");
        var renterIdProp = typeof(DomainRentalRequest).GetProperty("RenterId");
        var warehouseIdProp = typeof(DomainRentalRequest).GetProperty("WarehouseId");
        var requestedAreaProp = typeof(DomainRentalRequest).GetProperty("RequestedArea");
        var startDateProp = typeof(DomainRentalRequest).GetProperty("StartDate");
        var durationMonthsProp = typeof(DomainRentalRequest).GetProperty("DurationMonths");
        var statusProp = typeof(DomainRentalRequest).GetProperty("Status");
        var notesProp = typeof(DomainRentalRequest).GetProperty("Notes");
        var createdAtProp = typeof(DomainRentalRequest).GetProperty("CreatedAt");
        var reviewedByProp = typeof(DomainRentalRequest).GetProperty("ReviewedBy");
        var reviewedAtProp = typeof(DomainRentalRequest).GetProperty("ReviewedAt");
        var rejectionReasonProp = typeof(DomainRentalRequest).GetProperty("RejectionReason");
        var contractImageUrlProp = typeof(DomainRentalRequest).GetProperty("ContractImageUrl");
        var rentalAreaIdProp = typeof(DomainRentalRequest).GetProperty("RentalAreaId");
        var warehouseProp = typeof(DomainRentalRequest).GetProperty("Warehouse");

        requestIdProp?.SetValue(domainRequest, dbRequest.RequestId);
        renterIdProp?.SetValue(domainRequest, dbRequest.RenterId);
        warehouseIdProp?.SetValue(domainRequest, dbRequest.WarehouseId);
        requestedAreaProp?.SetValue(domainRequest, dbRequest.RequestedArea);
        startDateProp?.SetValue(domainRequest, dbRequest.StartDate);
        durationMonthsProp?.SetValue(domainRequest, dbRequest.DurationMonths);
        statusProp?.SetValue(domainRequest, dbRequest.Status);
        notesProp?.SetValue(domainRequest, dbRequest.Notes);
        createdAtProp?.SetValue(domainRequest, dbRequest.CreatedAt ?? DateTime.UtcNow);
        reviewedByProp?.SetValue(domainRequest, dbRequest.ReviewedBy);
        reviewedAtProp?.SetValue(domainRequest, dbRequest.ReviewedAt);
        rejectionReasonProp?.SetValue(domainRequest, dbRequest.RejectionReason);
        contractImageUrlProp?.SetValue(domainRequest, dbRequest.ContractImageUrl);
        rentalAreaIdProp?.SetValue(domainRequest, dbRequest.RentalAreaId);
        warehouseProp?.SetValue(domainRequest, dbRequest.Warehouse);  // Map Warehouse navigation

        var isCustomAreaProp = typeof(DomainRentalRequest).GetProperty("IsCustomArea");
        var proposedPositionXProp = typeof(DomainRentalRequest).GetProperty("ProposedPositionX");
        var proposedPositionYProp = typeof(DomainRentalRequest).GetProperty("ProposedPositionY");
        var proposedWidthProp = typeof(DomainRentalRequest).GetProperty("ProposedWidth");
        var proposedLengthProp = typeof(DomainRentalRequest).GetProperty("ProposedLength");
        var baseRentalAreaIdProp = typeof(DomainRentalRequest).GetProperty("BaseRentalAreaId");

        isCustomAreaProp?.SetValue(domainRequest, dbRequest.IsCustomArea);
        var isOwnerAssignedProp = typeof(DomainRentalRequest).GetProperty("IsOwnerAssigned");
        isOwnerAssignedProp?.SetValue(domainRequest, dbRequest.IsOwnerAssigned);
        proposedPositionXProp?.SetValue(domainRequest, dbRequest.ProposedPositionX);
        proposedPositionYProp?.SetValue(domainRequest, dbRequest.ProposedPositionY);
        proposedWidthProp?.SetValue(domainRequest, dbRequest.ProposedWidth);
        proposedLengthProp?.SetValue(domainRequest, dbRequest.ProposedLength);
        baseRentalAreaIdProp?.SetValue(domainRequest, dbRequest.BaseRentalAreaId);

        // Extension zone (L-shape)
        var hasExtensionZoneProp = typeof(DomainRentalRequest).GetProperty("HasExtensionZone");
        var extensionPositionXProp = typeof(DomainRentalRequest).GetProperty("ExtensionPositionX");
        var extensionPositionYProp = typeof(DomainRentalRequest).GetProperty("ExtensionPositionY");
        var extensionWidthProp = typeof(DomainRentalRequest).GetProperty("ExtensionWidth");
        var extensionLengthProp = typeof(DomainRentalRequest).GetProperty("ExtensionLength");

        hasExtensionZoneProp?.SetValue(domainRequest, dbRequest.HasExtensionZone);
        extensionPositionXProp?.SetValue(domainRequest, dbRequest.ExtensionPositionX);
        extensionPositionYProp?.SetValue(domainRequest, dbRequest.ExtensionPositionY);
        extensionWidthProp?.SetValue(domainRequest, dbRequest.ExtensionWidth);
        extensionLengthProp?.SetValue(domainRequest, dbRequest.ExtensionLength);

        return domainRequest;
    }
}
