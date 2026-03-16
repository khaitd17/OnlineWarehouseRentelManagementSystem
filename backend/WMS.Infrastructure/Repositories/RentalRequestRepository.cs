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

    public async Task<int> AddAsync(DomainRentalRequest request)
    {
        var dbRequest = new DbRentalRequest
        {
            RenterId = request.RenterId,
            WarehouseId = request.WarehouseId,
            RequestedArea = request.RequestedArea,
            StartDate = request.StartDate,
            DurationMonths = request.DurationMonths,
            Status = request.Status,
            Notes = request.Notes,
            CreatedAt = request.CreatedAt
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
        dbRequest.UpdatedAt = DateTime.UtcNow;

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

        return domainRequest;
    }
}
